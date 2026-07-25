import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
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
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(userId);

    // Expire the cookie immediately with maxAge: 0.
    response.cookie('lxuy_refresh_token', '', {
      ...this.getCookieOptions(request),
      maxAge: 0,
    });

    return { message: 'Logged out successfully' };
  }
}
