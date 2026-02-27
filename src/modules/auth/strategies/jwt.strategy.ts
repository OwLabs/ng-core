import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayload } from '../domain/types';

/**
 * JwtStrategy — fixed
 *
 * FIXED: Uses ConfigService instead of process.env
 *   Before: process.env.JWT_SECRET!  ← unsafe, could be undefined
 *   After:  configService.get()      ← validated, consistent
 *
 * HOW THIS WORKS:
 *   1. Client sends: Authorization: Bearer <access_token>
 *   2. Passport extracts the token from the header
 *   3. Passport verifies the JWT signature with the secret
 *   4. If valid, calls validate() with the decoded payload
 *   5. validate() returns what becomes req.user
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * This return value becomes req.user in your controllers
   *
   * IMPORTANT: Notice the property names here.
   * JWT standard uses "sub" for subject (user ID).
   * We map it to "userId" for clarity in controllers.
   */
  async validate(payload: TokenPayload) {
    return { userId: payload.sub, email: payload.email, roles: payload.roles };
  }
}
