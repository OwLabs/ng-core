import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiVersionEnum } from 'src/api';
import { UsersService } from '../services';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { RoleEnum, Roles } from 'src/common/decorators';

@ApiTags('Users')
@Controller({
  path: 'users',
  version: ApiVersionEnum.V1,
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.SUPER_ADMIN, RoleEnum.ADMIN)
  @Get()
  async getAllUsers(@Req() req) {
    const users = await this.usersService.findAll();
    return users;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('profile')
  async getProfile(@Req() req) {
    const userId = req.user.userId;
    const user = await this.usersService.getProfile(userId);
    return user;
  }
}
