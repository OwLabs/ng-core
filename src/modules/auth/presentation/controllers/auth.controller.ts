import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiVersionEnum } from 'src/common/config';
import {
  AuthService,
  OtpTokenService,
  RefreshTokenService,
} from '../../services';
import {
  LoginDto,
  LogoutDto,
  RefreshTokenDto,
  RegisterDto,
  ResendOtpDto,
  VerifyOtpDto,
} from '../../dto';
import { UserResponse } from 'src/modules/users/domain/types';
import { AuthGuard } from '@nestjs/passport';
import { Request as ExpressRequest } from 'express';
import { AuthTokens } from '../../domain/types';
import { extractClientIp } from '../utils';
import { VerifyUserCommand } from 'src/modules/users/application/commands/impl';
import { CommandBus } from '@nestjs/cqrs';

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
    private readonly otpTokenService: OtpTokenService,
    private readonly commandBus: CommandBus,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    return {
      message: 'Registration successful. Please verify your email.',
      otpTokenId: result.otpTokenId,
      user: result.user,
    };
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(
    @Request() dto: LoginDto,
    req: ExpressRequest,
  ): Promise<AuthTokens> {
    // req.user is set by LocalStrategy.validate()
    // which returns UserResponse

    const user = req.user as UserResponse;

    // LocalStrategy already validated password. But if user is unverified, req.user won't be set because LocalStrategy throws.
    // So we need to handle the unverified case differently.
    if (!user.isVerified) {
      const result = await this.otpTokenService.generateAndSendOtp(
        user.id,
        user.email,
      );

      throw new ForbiddenException({
        message: 'Email not verified. Please check your inbox',
        otpTokenId: result.otpTokenId,
      });
    }

    return this.authService.login(user, {
      userAgent: req.headers['user-agent'],
      ip: extractClientIp(req),
      tokenTtlDays: 30,
    });
  }

  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const result = await this.otpTokenService.verifyOtp(
      dto.otpTokenId,
      dto.code,
    );

    await this.commandBus.execute(new VerifyUserCommand(result.userId));

    return { message: 'Email verified successfully' };
  }

  @Post('resend-otp')
  async resendOtp(@Body() dto: ResendOtpDto) {
    await this.otpTokenService.resendOtp(dto.otpTokenId);
    return { message: 'OTP resent successfully' };
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
