import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from 'src/core/infrastructure/repositories';
import { RegisterDto } from '../dto';
import { IUser } from 'src/core/domain/interfaces';
import * as bcrypt from 'bcryptjs';
import { AuthResult } from '../types';
import { sanitizeUser } from 'src/common/utils';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepo: UserRepository,
    private readonly refreshTokenService: RefreshTokenService,
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

  async login(
    user: IUser,
    ctx: { userAgent?: string; ip?: string; tokenTtlDays?: number },
  ): Promise<{ access_token: string; newRawToken: string }> {
    const payload = { email: user.email, sub: user._id, roles: user.roles };
    const access_token = this.jwtService.sign(payload);

    const { plain: newRawToken } = await this.refreshTokenService.createToken(
      user._id!.toString(),
      {
        userAgent: ctx.userAgent,
        ip: ctx.ip,
        tokenTtlDays: ctx.tokenTtlDays,
      },
    );
    return { access_token, newRawToken };
  }

  async validateGoogleUser(profile: {
    providerId: string;
    email: string;
    name: string;
    picture?: string;
  }): Promise<Omit<IUser, 'password'>> {
    let user = await this.userRepo.findByEmail(profile.email);

    if (!user) {
      user = await this.userRepo.create({
        email: profile.email,
        name: profile.name,
        provider: 'google',
        providerId: profile.providerId,
        avatar: profile.picture,
        roles: ['user'],
      });
    }

    return sanitizeUser(user);
  }
}
