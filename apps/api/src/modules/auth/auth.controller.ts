import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  Query,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  ResendVerificationDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

interface JwtRefreshPayload {
  sub: string;
  email: string;
  role: string;
}

@Controller('api/v1/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Derives safe cookie options based on whether the request originates
   * from a localhost environment (HTTP) or a production deployment (HTTPS).
   */
  private getCookieOptions(request?: Request) {
    const host = request?.headers['host'] || '';
    const isLocalhost =
      host.includes('localhost') || host.includes('127.0.0.1');

    return {
      httpOnly: true,
      secure: isLocalhost ? false : true,
      sameSite: isLocalhost ? ('lax' as const) : ('strict' as const),
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    };
  }

  /** Registration — stricter rate limit: 3 attempts per minute per IP. */
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /** Login — stricter rate limit: 5 attempts per minute per IP. */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(loginDto);

    response.cookie('lxuy_refresh_token', result.refreshToken, this.getCookieOptions(request));

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  /**
   * Token refresh — skips the global throttle (the cookie itself is the
   * rate-limiting factor; losing it means the user must log in again).
   * CRITICAL FIX: uses jwtService.verify() with the REFRESH secret instead
   * of jwtService.decode() — this rejects tampered or expired tokens BEFORE
   * any database call is made.
   */
  @SkipThrottle()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const cookies = request.cookies as Record<string, string | undefined> | undefined;
    this.logger.log(`Incoming refresh request. Cookies: ${JSON.stringify(cookies)}`);
    const refreshToken = cookies?.['lxuy_refresh_token'];

    if (!refreshToken) {
      this.logger.warn('Refresh token is missing from request cookies');
      throw new UnauthorizedException('Refresh token missing');
    }

    let payload: JwtRefreshPayload;
    try {
      // jwtService.verify() validates signature AND expiry.
      // A tampered or expired refresh token will throw here — no DB call made.
      payload = this.jwtService.verify<JwtRefreshPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch (err) {
      this.logger.warn(
        `Refresh token verification failed: ${(err as Error).message}`,
      );
      // Clear the bad cookie so the client is forced back to login.
      response.clearCookie('lxuy_refresh_token', { path: '/' });
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!payload.sub) {
      this.logger.warn('Refresh token payload has no "sub" field');
      throw new UnauthorizedException('Invalid refresh token payload');
    }

    this.logger.log(`Refresh token verified for user sub: ${payload.sub}. Fetching user...`);
    const result = await this.authService.refreshTokens(payload.sub, refreshToken);
    response.cookie('lxuy_refresh_token', result.refreshToken, this.getCookieOptions(request));

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  /** Protected — requires a valid access token. Skips throttler. */
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser('id') userId: string) {
    return this.authService.getCurrentUser(userId);
  }

  /** Protected — requires a valid access token. Skips throttler. */
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser('id') userId: string,
    @CurrentUser('tokenId') tokenId: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(userId, tokenId);

    // Expire the cookie immediately with maxAge: 0.
    response.cookie('lxuy_refresh_token', '', {
      ...this.getCookieOptions(request),
      maxAge: 0,
    });

    return { message: 'Logged out successfully' };
  }

  /** Protected — requires a valid access token. Skips throttler. */
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @CurrentUser('id') userId: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logoutAll(userId);

    // Expire the cookie immediately with maxAge: 0.
    response.cookie('lxuy_refresh_token', '', {
      ...this.getCookieOptions(request),
      maxAge: 0,
    });

    return { message: 'Logged out of all devices successfully' };
  }

  /**
   * Email verification — follows the link sent to the user's inbox.
   * AUTH-018 (valid), AUTH-019 (expired), AUTH-020 (invalid), AUTH-021 (double-click), AUTH-025 (deleted account).
   */
  @SkipThrottle()
  @Get('verify-email')
  async verifyEmail(
    @Query() query: VerifyEmailDto,
    @Res() response: Response,
  ) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    if (!query.token) {
      return response.redirect(
        `${frontendUrl}/login?verified=false&reason=missing_token`,
      );
    }

    try {
      const result = await this.authService.verifyEmail(query.token);
      if (result.message.toLowerCase().includes('already')) {
        return response.redirect(
          `${frontendUrl}/login?verified=false&reason=already_verified`,
        );
      }
      return response.redirect(`${frontendUrl}/login?verified=true`);
    } catch (err: unknown) {
      let reason = 'invalid_token';
      if (err instanceof BadRequestException) {
        const msg = err.message.toLowerCase();
        if (msg.includes('expired')) {
          reason = 'expired';
        }
      }
      return response.redirect(
        `${frontendUrl}/login?verified=false&reason=${reason}`,
      );
    }
  }


  /**
   * Resend verification email — stricter rate limit: 3 per 10 minutes per IP (AUTH-023, AUTH-024).
   */
  @Throttle({ default: { limit: 3, ttl: 600000 } })
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  /**
   * Google login redirect endpoint.
   * Redirects user to Google OAuth consent page.
   */
  @SkipThrottle()
  @Get('google')
  async googleLogin(@Res() response: Response) {
    const authUrl = this.authService.getGoogleAuthUrl();
    return response.redirect(authUrl);
  }

  /**
   * Google OAuth Callback endpoint.
   * Google redirects users here after authorization.
   */
  @SkipThrottle()
  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    if (!code) {
      this.logger.warn('Google authorization code is missing from callback query.');
      return response.redirect(
        `${frontendUrl}/login?social_login=error&reason=missing_code`,
      );
    }

    try {
      const result = await this.authService.handleGoogleCallback(code);
      response.cookie(
        'lxuy_refresh_token',
        result.tokens.refreshToken,
        this.getCookieOptions(request),
      );
      return response.redirect(`${frontendUrl}/login?social_login=success`);
    } catch (err: unknown) {
      this.logger.error(
        `Google callback processing failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return response.redirect(
        `${frontendUrl}/login?social_login=error&reason=processing_failed`,
      );
    }
  }

  /**
   * Request password reset link (Forgot Password).
   * Rate limited: 3 requests per 10 minutes (600,000 ms) per IP.
   */
  @Throttle({ default: { limit: 3, ttl: 600000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  /**
   * Verify password reset token (GET redirect handler).
   * Validates the token and redirects the browser to the frontend reset page.
   */
  @SkipThrottle()
  @Get('reset-password')
  async verifyResetToken(
    @Query('token') token: string,
    @Res() response: Response,
  ) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    if (!token) {
      return response.redirect(
        `${frontendUrl}/login?reset_status=error&reason=missing_token`,
      );
    }

    try {
      const isValid = await this.authService.verifyResetToken(token);
      if (!isValid) {
        return response.redirect(
          `${frontendUrl}/login?reset_status=error&reason=expired`,
        );
      }
      // Token is valid. Redirect to frontend reset form page, passing the raw token
      return response.redirect(`${frontendUrl}/reset-password?token=${token}`);
    } catch (err: unknown) {
      this.logger.error(`Reset token validation failed: ${err instanceof Error ? err.message : String(err)}`);
      return response.redirect(
        `${frontendUrl}/login?reset_status=error&reason=invalid_token`,
      );
    }
  }

  /**
   * Complete password reset.
   * Receives token and new password, completes reset in DB, and revokes active sessions.
   */
  @SkipThrottle()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match.');
    }
    return this.authService.resetPassword(dto.token, dto.password);
  }

  /**
   * Dummy endpoint to test customer access (AUTH-079, AUTH-080).
   */
  @SkipThrottle()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  @Get('test/customer')
  testCustomer() {
    return {
      status: 'success',
      message: 'Access granted to customer route',
    };
  }

  /**
   * Dummy endpoint to test admin access (AUTH-077, AUTH-078, AUTH-079, AUTH-080).
   */
  @SkipThrottle()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('test/admin')
  testAdmin() {
    return {
      status: 'success',
      message: 'Access granted to admin route',
    };
  }
}
