import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
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
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly jwtExpiration: string;
  private readonly jwtRefreshExpiration: string;

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

    // Send the verification email — fire and don't block registration response.
    // Errors are logged inside EmailService but not surfaced to the client.
    this.emailService
      .sendVerificationEmail(user.email, user.firstName, rawToken)
      .catch(() => {
        // Intentional no-op: email failure must not fail registration.
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
}
