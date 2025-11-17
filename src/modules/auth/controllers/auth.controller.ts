import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from '../services';
import { RegisterDto } from '../dto';
import { AuthGuard } from '@nestjs/passport';
import { IUser } from 'src/core/domain/interfaces';
import { ApiVersionEnum } from 'src/api';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller({
  path: 'auth',
  version: ApiVersionEnum.V1,
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<IUser> {
    return this.authService.register(dto);
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }
}
