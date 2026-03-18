import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../services';
import { UserResponse } from 'src/modules/users/domain/types';
import { UserValidationException } from 'src/modules/users/domain/exceptions';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<UserResponse> {
    const result = await this.authService.validateUser(email, password);

    if (!result.success) {
      // (SCENARIO) If it's a verification issue, we STILL return the user so the controller can handle it
      if (result.unverified) {
        return result.user;
      }

      // If it's a WRONG password or email, then we throw as usual.
      throw new UserValidationException(result.message, this, result.errorCode);
    }

    // result.user becomes req.user in the controller
    return result.user;
  }
}
