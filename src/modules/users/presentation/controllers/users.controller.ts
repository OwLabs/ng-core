import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { ApiVersionEnum } from 'src/common/config';
import { Roles } from 'src/common/decorators';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { UserRole } from '../../domain/enums';
import { User } from '../../domain/entities';
import {
  GetAllUsersQuery,
  GetUserProfileQuery,
} from '../../application/queries/impl';
import { UpdateUserRolesCommand } from '../../application/commands/impl';

/**
 * UsersController — The PRESENTATION layer.
 *
 * === THIN CONTROLLER PRINCIPLE ===
 *
 * The controller does ONLY 3 things:
 *   1. Read the HTTP request (params, body, headers)
 *   2. Create a Command or Query, dispatch it via bus
 *   3. Transform the result into HTTP response
 *
 * NO business logic. NO database calls. NO validation
 * All of that lives in handlers and entities
 *
 * NOTICE: No UsersService injected! We use CommandBus/QueryBus
 * The bus automatically routes to the correct handler
 *
 * NOTE ON @Roles(): Your existing decorator expects RoleEnum from
 * common/decorators. We're using UserRole from our domain with
 * `as any` as a temporary bridge. When you refactor auth module,
 * you'll update @Roles() to accept UserRole and remove `as any`.
 */
@ApiTags('Users')
@Controller({
  path: 'users',
  version: ApiVersionEnum.V1,
})
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * GET /v1/users — Admin only
   *
   * FLOW: HTTP → Controller → QueryBus → GetAllUsersHandler
   *         → Repository → MongoDB → User[] → toResponse() → JSON
   *
   * NOTICE: user.toResponse() replaces sanitizeUser()
   * The entity decides what to expose. Password never included
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN as any, UserRole.ADMIN as any)
  @Get()
  async getAllUsers() {
    const users: User[] = await this.queryBus.execute(new GetAllUsersQuery());
    return users.map((user) => user.toResponse());
  }

  /**
   * GET /v1/users/profile — Logged-in user's own profile.
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req) {
    const userId = req.user.userId;
    const user: User = await this.queryBus.execute(
      new GetUserProfileQuery(userId),
    );

    return user.toResponse();
  }

  /**
   * PATCH /v1/users/:userId/roles — Super admin updates roles
   *
   * FLOW: HTTP → Controller → CommandBus → UpdateUserRolesHandler
   *         → User.updateRoles() (validates) → Repository.save()
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN as any)
  @Patch(':userId/roles')
  async uppdateUserRoles(
    @Param('userId') userId: string,
    @Body() body: { roles: UserRole[] },
  ) {
    const user: User = await this.commandBus.execute(
      new UpdateUserRolesCommand(userId, body.roles),
    );

    return user.toResponse();
  }
}
