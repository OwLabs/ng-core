import {
  Body,
  Controller,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService, RefreshTokenService } from '../services';
import { LogoutDto, RefreshTokenDto, RegisterDto } from '../dto';
import { AuthGuard } from '@nestjs/passport';
import { IUser } from 'src/core/domain/interfaces';
import { ApiVersionEnum } from 'src/api';
import { ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';

@ApiTags('Auth')
@Controller({
  path: 'auth',
  version: ApiVersionEnum.V1,
})
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<IUser> {
    return this.authService.register(dto);
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(
    @Request() req: ExpressRequest,
  ): Promise<{ access_token: string; newRawToken: string }> {
    const forwardedFor = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : (forwardedFor ?? req.ip)?.toString().split(',')[0].trim();

    return this.authService.login(req.user as IUser, {
      userAgent: req.headers['user-agent'],
      ip,
      tokenTtlDays: 30,
    });
  }

  @Post('refresh')
  async refresh(
    @Body() dto: RefreshTokenDto,
  ): Promise<{ accessToken: string; newRefreshToken: string }> {
    if (!dto.refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    // Rotate -> revoke old token value -> generate new tokens
    const { accessToken, newRefreshToken } =
      await this.refreshTokenService.rotateRefreshToken({
        refreshToken: dto.refreshToken,
      });

    return { accessToken, newRefreshToken };
  }

  /**
   * Just logout the current device/session
   */
  @Post('logout')
  async logout(@Body() dto: LogoutDto) {
    if (!dto.refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const validated = await this.refreshTokenService.validateRefreshToken(
      dto.refreshToken,
    );

    const data = await this.refreshTokenService.revokeTokenById(
      validated._id!.toString(),
    );

    return { message: data.message };
  }

  /**
   * Logout ALL DEVICES for current user
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('logout-all-devices')
  async logoutAllDevices(@Request() req: ExpressRequest) {
    const user = req.user as IUser;

    if (!user._id) {
      throw new UnauthorizedException('Unauthorized');
    }

    await this.refreshTokenService.revokeAllForUser(user._id.toString());

    return { message: 'Logged out from all devices successfully' };
  }
}
