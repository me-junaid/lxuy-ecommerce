import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');

    // Fail fast at startup if the secret is not configured.
    // A missing secret means every token would be signed with undefined,
    // which crashes jwt.verify() — better to surface the problem immediately.
    if (!secret) {
      throw new Error(
        'JWT_SECRET environment variable is not set. Cannot initialize JwtStrategy.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Called by Passport after the token signature and expiry are verified.
   * We perform a live DB check here to guarantee:
   *   1. The user still exists (wasn't deleted after the token was issued).
   *   2. The account is still active (wasn't banned/deactivated).
   *   3. The token was issued AFTER the last password change (invalidates
   *      tokens that belong to an old password session).
   *
   * The result of this method is attached to `request.user`.
   */
  async validate(payload: JwtPayload) {
    // findById already filters { isActive: true } in the query.
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Account not found or deactivated');
    }

    // If the user has changed their password, reject tokens issued before
    // the change so old sessions are immediately invalidated.
    if (user.passwordChangedAt) {
      const tokenIssuedAt = payload.iat * 1000; // convert seconds → ms
      const passwordChangedAt = new Date(user.passwordChangedAt).getTime();
      if (tokenIssuedAt < passwordChangedAt) {
        throw new UnauthorizedException(
          'Password has been changed. Please log in again.',
        );
      }
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
