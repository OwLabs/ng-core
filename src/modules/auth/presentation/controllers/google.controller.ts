import {
  Controller,
  Get,
  Req,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from '../../services';
import { AuthGuard } from '@nestjs/passport';
import { Request as ExpressRequest } from 'express';
import { UserResponse } from 'src/modules/users/domain/types';
import { extractClientIp } from '../utils';

@ApiTags('Google Auth')
@Controller({ path: 'auth/google', version: VERSION_NEUTRAL })
export class GoogleAuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @UseGuards(AuthGuard('google'))
  async googleLogin() {
    // Google redirects automatically
    /** DO NOT WRITE ANYTHING INSIDE HERE **/
  }

  @Get('redirect')
  async googleLoginRedirect(@Req() req: ExpressRequest) {
    const googleUser = req.user as UserResponse;

    const tokens = await this.authService.login(googleUser, {
      userAgent: req.headers['user-agent'],
      ip: extractClientIp(req),
    });

    return {
      message: 'Google login successfully',
      ...tokens,
      user: {
        name: googleUser.name,
        email: googleUser.email,
      },
    };
  }
}
