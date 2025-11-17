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

@ApiTags('Google Auth')
@Controller({ path: 'auth/google', version: VERSION_NEUTRAL })
export class GoogleAuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @UseGuards(AuthGuard('google'))
  async googleLogin() {}

  @Get('redirect')
  @UseGuards(AuthGuard('google'))
  async googleLoginRedirect(@Req() req) {
    return req.user;
  }
}
