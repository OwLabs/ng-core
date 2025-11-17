import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from 'src/core/infrastructure/repositories';
import { RegisterDto } from '../dto';
import { IUser } from 'src/core/domain/interfaces';
import * as bcrypt from 'bcryptjs';
import { AuthResult } from '../types';
import { sanitizeUser } from 'src/common/utils';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepo: UserRepository,
  ) {}

  async register(dto: RegisterDto): Promise<IUser> {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const user: IUser = await this.userRepo.create({
      ...dto,
      password: hashed,
      provider: 'local',
      roles: ['user'],
    });

    return sanitizeUser(user);
  }

  async validateUser(email: string, password: string): Promise<AuthResult> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      return { success: false, message: 'Email not found' };
    }

    if (user.provider !== 'local' || !user.password) {
      return {
        success: false,
        message: 'Log in with Google or reset password with "Reset password',
      };
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return { success: false, message: 'Incorrect password' };
    }

    return { success: true, user: sanitizeUser(user) };
  }

  async login(user: IUser) {
    const payload = { email: user.email, sub: user._id, roles: user.roles };
    const access_token = this.jwtService.sign(payload);
    return { access_token };
  }

  async validateGoogleUser(profile: {
    providerId: string;
    email: string;
    name: string;
    picture?: string;
  }) {
    let user = await this.userRepo.findByEmail(profile.email);

    if (!user) {
      user = await this.userRepo.create({
        email: profile.email,
        name: profile.name,
        provider: 'google',
        providerId: profile.providerId,
        avatar: profile.picture,
        roles: ['student'],
      });
    }

    const payload = { email: user?.email, sub: user?._id, roles: user?.roles };
    const access_token = this.jwtService.sign(payload);
    return { access_token, user: sanitizeUser(user) };
  }
}
