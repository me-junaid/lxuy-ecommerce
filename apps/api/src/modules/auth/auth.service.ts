import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { RegisterDto, LoginDto } from './auth.dto';
import { UserDocument } from '../users/user.schema';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly jwtExpiration: string;
  private readonly jwtRefreshExpiration: string;
  private readonly googleClientId: string;
  private readonly googleClientSecret: string;
  private readonly backendUrl: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {
    // Resolve secrets at construction time so a missing value throws
    // immediately at startup rather than silently at runtime.
    const secret = this.configService.get<string>('JWT_SECRET');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    if (!secret) {
      throw new InternalServerErrorException(
        'JWT_SECRET environment variable is not set. Server cannot start safely.',
      );
    }
    if (!refreshSecret) {
      throw new InternalServerErrorException(
        'JWT_REFRESH_SECRET environment variable is not set. Server cannot start safely.',
      );
    }

    this.jwtSecret = secret;
    this.jwtRefreshSecret = refreshSecret;
    this.jwtExpiration =
      this.configService.get<string>('JWT_EXPIRATION') || '15m';
    this.jwtRefreshExpiration =
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';

    this.googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID') ?? '';
    this.googleClientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET') ?? '';
    this.backendUrl = this.configService.get<string>('BACKEND_URL') ?? 'http://localhost:3001';

    if (!this.googleClientId || !this.googleClientSecret) {
      this.logger.warn(
        'GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing. Google OAuth logins will not function.',
      );
    }
  }

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);

    // Generate a cryptographically secure 32-byte random token.
    // Only the SHA-256 hash is persisted; the raw token goes in the email link.
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.usersService.setEmailVerificationToken(
      user._id.toString(),
      hashedToken,
      expires,
    );

    // Fire-and-forget: email failure must never block registration.
    // Log the error so it is visible in the NestJS console for debugging.
    this.emailService
      .sendVerificationEmail(user.email, user.firstName, rawToken)
      .catch((err: unknown) => {
        this.logger.error(
          `Failed to send verification email to ${user.email}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      });

    return user.toJSON() as Record<string, unknown>;
  }

  async login(loginDto: LoginDto) {
    // findByEmail already filters isActive === true — no extra check needed.
    const user = await this.usersService.findByEmail(
      loginDto.email,
      '+password',
    );
    if (!user) {
      // Use a generic message to avoid username enumeration.
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      // User registered with Google and has no password set.
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.generateTokens(user);

    // Persist refresh token and update last login in a single database write.
    await this.usersService.updateRefreshToken(
      user._id.toString(),
      tokens.refreshToken,
      null,
      true,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: user.toJSON() as Record<string, unknown>,
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    // Single DB query: fetch the user + both token hashes simultaneously.
    const user = await this.usersService.findByIdWithRefreshHash(userId);

    if (!user) {
      throw new UnauthorizedException('Access denied');
    }

    // Check the current hash first (normal case).
    let isValid = false;
    let matchedPrev = false;

    if (user.refreshTokenHash) {
      isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    }

    // If current hash didn't match, check the PREVIOUS hash.
    // This handles the race condition where two near-simultaneous page reloads
    // both call /refresh — the first call rotates the token so the second
    // call arrives with the "old" token. We allow it once via prevRefreshTokenHash.
    if (!isValid && user.prevRefreshTokenHash) {
      isValid = await bcrypt.compare(refreshToken, user.prevRefreshTokenHash);
      if (isValid) matchedPrev = true;
    }

    if (!isValid) {
      throw new UnauthorizedException('Access denied');
    }

    const tokens = this.generateTokens(user);

    // Rotate: the old current hash becomes the new previous hash (grace window).
    // If the request matched the prev hash (second rapid reload), we don't
    // re-rotate — we just re-issue tokens using the current valid state.
    const oldCurrentHash = matchedPrev ? null : user.refreshTokenHash ?? null;

    await this.usersService.updateRefreshToken(
      user._id.toString(),
      tokens.refreshToken,
      oldCurrentHash, // becomes prevRefreshTokenHash in the DB
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: user.toJSON() as Record<string, unknown>,
    };
  }

  async logout(userId: string) {
    // Invalidate the stored refresh token hash so the cookie is useless.
    await this.usersService.updateRefreshToken(userId, null);
  }

  async getCurrentUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user.toJSON() as Record<string, unknown>;
  }

  private generateTokens(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.jwtSecret,
      expiresIn: this.jwtExpiration,
    } as unknown as JwtSignOptions);

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.jwtRefreshSecret,
      expiresIn: this.jwtRefreshExpiration,
    } as unknown as JwtSignOptions);

    return { accessToken, refreshToken };
  }

  /**
   * Verifies the raw token from the email link (AUTH-018–021, AUTH-025).
   * Looks up the user by the SHA-256 hash; errors if token is invalid/expired/already used.
   */
  async verifyEmail(rawToken: string): Promise<{ message: string }> {
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await this.usersService.findByEmailVerificationToken(hashedToken);

    if (!user) {
      // Token not found or expired. Check if maybe the email is already verified
      // to give a friendlier message for the double-click case (AUTH-021).
      throw new BadRequestException(
        'This verification link is invalid or has expired. Please request a new one.',
      );
    }

    if (user.isEmailVerified) {
      // Already verified — idempotent response (AUTH-021).
      return { message: 'Your email address is already verified. You can log in.' };
    }

    await this.usersService.markEmailVerified(user._id.toString());
    return { message: 'Email verified successfully. You can now log in.' };
  }

  /**
   * Resends the verification email (AUTH-023, AUTH-024).
   * Rate limiting is enforced at the controller level via @Throttle.
   */
  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      // Don't reveal whether the email exists — prevents user enumeration.
      return { message: 'If this email is registered, a new verification link has been sent.' };
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('This email address is already verified.');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.usersService.setEmailVerificationToken(
      user._id.toString(),
      hashedToken,
      expires,
    );

    await this.emailService.sendVerificationEmail(user.email, user.firstName, rawToken);

    return { message: 'If this email is registered, a new verification link has been sent.' };
  }

  /**
   * Generates the Google OAuth2.0 consent URL for authentication.
   */
  getGoogleAuthUrl(): string {
    if (!this.googleClientId) {
      throw new BadRequestException('Google Client ID is not configured on the server.');
    }
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
      redirect_uri: `${this.backendUrl}/api/v1/auth/google/callback`,
      client_id: this.googleClientId,
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ].join(' '),
    };

    const qs = new URLSearchParams(options).toString();
    return `${rootUrl}?${qs}`;
  }

  /**
   * Handles exchange of Google callback authorization code.
   * Exchanges code, retrieves Google user details, registers/syncs the user,
   * and generates access + refresh tokens.
   */
  async handleGoogleCallback(code: string) {
    if (!this.googleClientId || !this.googleClientSecret) {
      throw new InternalServerErrorException('Google OAuth configurations are missing on the server.');
    }

    let tokenData: { access_token: string };
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: this.googleClientId,
          client_secret: this.googleClientSecret,
          redirect_uri: `${this.backendUrl}/api/v1/auth/google/callback`,
          grant_type: 'authorization_code',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Google token exchange failed: ${errorText}`);
        throw new BadRequestException('Failed to exchange authorization code for tokens.');
      }

      tokenData = (await response.json()) as { access_token: string };
    } catch (err: unknown) {
      this.logger.error(`Error during Google token exchange: ${err instanceof Error ? err.message : String(err)}`);
      throw new BadRequestException('Token exchange failed.');
    }

    let googleProfile: {
      id: string;
      email: string;
      verified_email: boolean;
      given_name: string;
      family_name: string;
    };

    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve user profile information from Google.');
      }

      googleProfile = (await response.json()) as typeof googleProfile;
    } catch (err: unknown) {
      this.logger.error(`Error fetching Google user profile: ${err instanceof Error ? err.message : String(err)}`);
      throw new BadRequestException('Failed to retrieve user profile.');
    }

    if (!googleProfile.verified_email) {
      throw new BadRequestException('Your Google account email is not verified.');
    }

    // Sign in / sync the user
    const email = googleProfile.email.toLowerCase().trim();
    let user = await this.usersService.findByEmail(email);

    if (user) {
      // User exists. Update googleId if not linked yet.
      if (!user.googleId) {
        user.googleId = googleProfile.id;
        // Since Google verified the email, we also mark it verified in our DB
        if (!user.isEmailVerified) {
          user.isEmailVerified = true;
        }
        await user.save();
      }
    } else {
      // User doesn't exist. Create a new Google OAuth account.
      user = await this.usersService.create({
        email,
        googleId: googleProfile.id,
        firstName: googleProfile.given_name || 'Google',
        lastName: googleProfile.family_name || 'User',
        isEmailVerified: true, // Google verifies user emails
        isActive: true,
      });
    }

    const tokens = this.generateTokens(user);

    // Save refresh token and update audit trail
    await this.usersService.updateRefreshToken(
      user._id.toString(),
      tokens.refreshToken,
      null,
      true,
    );

    return {
      tokens,
      user: user.toJSON() as Record<string, unknown>,
    };
  }

  /**
   * Triggers the forgot password process.
   * Generates token, stores hash in DB, and fires the email link.
   * Fulfills AUTH-068 and AUTH-069.
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      // Return generic message to prevent user enumeration (AUTH-069)
      return {
        message: 'If this email is registered, a password reset link has been sent.',
      };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.usersService.setPasswordResetToken(
      user._id.toString(),
      hashedToken,
      expires,
    );

    // Send email fire-and-forget
    this.emailService
      .sendPasswordResetEmail(user.email, user.firstName, rawToken)
      .catch((err: unknown) => {
        this.logger.error(
          `Failed to send password reset email to ${user.email}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      });

    return {
      message: 'If this email is registered, a password reset link has been sent.',
    };
  }

  /**
   * Verifies if a password reset token exists and is valid (not expired).
   */
  async verifyResetToken(token: string): Promise<boolean> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.usersService.findByPasswordResetToken(hashedToken);
    return !!user;
  }

  /**
   * Completes the password reset process.
   * Fulfills AUTH-070 to AUTH-076.
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.usersService.findByPasswordResetToken(hashedToken);

    if (!user) {
      // Token not found or expired (AUTH-070, AUTH-071, AUTH-072)
      throw new BadRequestException(
        'This password reset link is invalid or has expired. Please request a new one.',
      );
    }

    // Prevent resetting to the same password (AUTH-074)
    if (user.password) {
      const isSame = await bcrypt.compare(newPassword, user.password);
      if (isSame) {
        throw new BadRequestException(
          'Your new password cannot be the same as your current password.',
        );
      }
    }

    // Save password (auto-hashes in pre-save hook) and clear reset token
    user.password = newPassword;
    await user.save();

    await this.usersService.clearPasswordResetToken(user._id.toString());

    // Invalidate all active sessions across all devices (AUTH-075)
    await this.usersService.updateRefreshToken(
      user._id.toString(),
      null,
      null,
      false,
    );

    return {
      message: 'Your password has been successfully reset. Please sign in with your new password.',
    };
  }
}
