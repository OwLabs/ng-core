import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  Res,
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
import { LoginDto, RegisterDto, ResendOtpDto, VerifyOtpDto } from '../../dto';
import { UserResponse } from 'src/modules/users/domain/types';
import { AuthGuard } from '@nestjs/passport';
import { Request as ExpressRequest, Response } from 'express';
import { AuthTokens } from '../../domain/types';
import { extractClientIp, getCookieOptions } from '../utils';
import { VerifyUserCommand } from 'src/modules/users/application/commands/impl';
import { CommandBus } from '@nestjs/cqrs';
import { UserVerificationException } from 'src/modules/users/domain/exceptions';
import { AUTH_COOKIE_NAMES } from '../../domain/constants';

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
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
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

      throw new UserVerificationException(
        'Email not verified. Please check your inbox',
        this,
        { otpTokenId: result.otpTokenId },
      );
    }

    const tokens = await this.authService.login(user, {
      userAgent: req.headers['user-agent'],
      ip: extractClientIp(req),
      tokenTtlDays: 30,
    });

    res.cookie(
      AUTH_COOKIE_NAMES.ACCESS_TOKEN,
      tokens.accessToken,
      getCookieOptions(15 * 60 * 1000), // 15 mins
    );

    res.cookie(
      AUTH_COOKIE_NAMES.REFRESH_TOKEN,
      tokens.refreshToken,
      getCookieOptions(30 * 24 * 60 * 60 * 1000), // 30 days
    );

    return { message: 'Login successful' };
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
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
  async refresh(
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const refreshToken = req.cookies[AUTH_COOKIE_NAMES.REFRESH_TOKEN];

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const tokens = await this.refreshTokenService.rotateRefreshToken({
      refreshToken,
      userAgent: req.headers['user-agent'],
      ip: extractClientIp(req),
    });

    res.cookie(
      AUTH_COOKIE_NAMES.ACCESS_TOKEN,
      tokens.accessToken,
      getCookieOptions(15 * 60 * 1000), // 15 mins
    );

    res.cookie(
      AUTH_COOKIE_NAMES.REFRESH_TOKEN,
      tokens.refreshToken,
      getCookieOptions(30 * 24 * 60 * 60 * 1000), // 30 days
    );

    return { message: 'Token refreshed successfully' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies[AUTH_COOKIE_NAMES.REFRESH_TOKEN];

    if (refreshToken) {
      const validated =
        await this.refreshTokenService.validateRefreshToken(refreshToken);

      await this.refreshTokenService.revokeTokenById(validated.id.toString());
    }

    res.clearCookie(AUTH_COOKIE_NAMES.ACCESS_TOKEN, getCookieOptions(0)); // use maxAge 0 to tell the browser to expire them immediately
    res.clearCookie(AUTH_COOKIE_NAMES.REFRESH_TOKEN, getCookieOptions(0));

    return;
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
