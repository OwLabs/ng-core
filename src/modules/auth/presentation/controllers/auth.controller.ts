import {
  Body,
  Controller,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiVersionEnum } from 'src/common/config';
import { AuthService, RefreshTokenService } from '../../services';
import { LogoutDto, RefreshTokenDto, RegisterDto } from '../../dto';
import { UserResponse } from 'src/modules/users/domain/types';
import { AuthGuard } from '@nestjs/passport';
import { Request as ExpressRequest } from 'express';
import { AuthTokens } from '../../domain/types';
import { extractClientIp } from '../utils';

/**
 * AuthController — fixed
 *
 * BUGS FIXED:
 *   - logoutAllDevices: uses req.user.userId (not _id)
 *   - Removed redundant DTO validation (ValidationPipe handles it)
 *   - Extracted IP logic to utility function (DRY)
 *   - Uses proper types (UserResponse, AuthTokens)
 */
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
  async register(@Body() dto: RegisterDto): Promise<UserResponse> {
    return this.authService.register(dto);
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req: ExpressRequest): Promise<AuthTokens> {
    // req.user is set by LocalStrategy.validate()
    // which returns UserResponse
    return this.authService.login(req.user as UserResponse, {
      userAgent: req.headers['user-agent'],
      ip: extractClientIp(req),
      tokenTtlDays: 30,
    });
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokens> {
    // No manual dto.refreshToken check needed
    // ValidationPipe handles it
    return this.refreshTokenService.rotateRefreshToken({
      refreshToken: dto.refreshToken,
    });
  }

  @Post('logout')
  async logout(@Body() dto: LogoutDto) {
    const validated = await this.refreshTokenService.validateRefreshToken(
      dto.refreshToken,
    );

    const data = await this.refreshTokenService.revokeTokenById(
      validated.id.toString(),
    );

    return { message: data.message };
  }

  /**
   * Logout ALL DEVICES for current user
   *
   * BUG FIX: Uses req.user.userId (from JwtStrategy)
   *   Before: req.user._id ← undefined! JWT returns userId, not _id
   *   After:  req.user.userId ← correct property name
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('logout-all-devices')
  async logoutAllDevices(@Request() req: ExpressRequest) {
    // JwtStrategy.validate() returns { userId, email, roles }
    const user = req.user as { userId: string; email: string; roles: string[] };

    if (!user.userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    await this.refreshTokenService.revokeAllForUser(user.userId);

    return { message: 'Logged out from all devices successfully' };
  }
}
