import {
  Controller,
  Get,
  Req,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { AuthService } from '../services';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { IUser } from 'src/core/domain/interfaces';

@ApiTags('Google Auth')
@Controller({ path: 'auth/google', version: VERSION_NEUTRAL })
export class GoogleAuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @UseGuards(AuthGuard('google'))
  async googleLogin() {
    // Google automatically redirects; no need to return anything.
  }

  @Get('redirect')
  async googleLoginRedirect(@Req() req: ExpressRequest) {
    const googleUser = req.user as IUser;

    const forwardedFor = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : (forwardedFor ?? req.ip)?.toString().split(',')[0].trim();

    const { access_token, newRawToken } = await this.authService.login(
      googleUser,
      {
        userAgent: req.headers['user-agent'],
        ip,
      },
    );

    return {
      message: 'Google login successfully',
      access_token,
      refresh_token: newRawToken,
      user: {
        name: googleUser.name,
        email: googleUser.email,
      },
    };
  }
}
