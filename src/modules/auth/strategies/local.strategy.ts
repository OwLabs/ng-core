import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../services';
import { IUser } from 'src/core/domain/interfaces';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<IUser> {
    const result = await this.authService.validateUser(email, password);

    if (!result.success) {
      throw new UnauthorizedException(result.message);
    }

    return result.user;
  }
}
