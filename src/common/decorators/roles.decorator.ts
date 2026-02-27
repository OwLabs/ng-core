import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/modules/users/domain/enums';

export const ROLES_KEY = 'roles';

/**
 * @Roles decorator — attaches required roles to a route
 *
 * WHY WE IMPORT UserRole HERE:
 *   Roles are a domain concept defined in users/domain/enums.
 *   This decorator is just a NestJS helper that stamps the
 *   metadata onto the route. It doesn't define what roles exist
 *
 * USAGE:
 *   @Roles(UserRole.ADMIN, UserRole.TUTOR)
 *   @Get('protected-route')
 *   async myRoute() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
