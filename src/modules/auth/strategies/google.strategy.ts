import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  StrategyOptions,
  VerifyCallback,
} from 'passport-google-oauth20';
import { AuthService } from '../services';
import { ConfigService } from '@nestjs/config';

/**
 * GoogleStrategy — fixed
 *
 * BUG FIX: validate() now has correct parameter signature
 *   Before: (profile, done) ← wrong! accessToken received as "profile"
 *   After:  (accessToken, refreshToken, profile, done) ← correct
 *
 * PASSPORT-GOOGLE-OAUTH20 CALLS:
 *   validate(accessToken, refreshToken, profile, done)
 *   - accessToken: Google's access token (we don't need it)
 *   - refreshToken: Google's refresh token (we don't need it)
 *   - profile: the user's Google profile data
 *   - done: callback to tell Passport "here's the user"
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
      // set to true if u want to access the req.user from Google entity
      // but for now we don't need it
      passReqToCallback: false,
    } as StrategyOptions);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { emails, displayName, photos, id } = profile;

    const user = await this.authService.validateGoogleUser({
      providerId: id,
      email: emails?.[0]?.value,
      name: displayName,
      picture: photos?.[0]?.value,
    });

    // user is UserResponse (from validateGoogleUser)
    // This becomes req.user in the controller
    done(null, user);
  }
}
