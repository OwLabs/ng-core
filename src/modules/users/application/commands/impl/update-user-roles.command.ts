import { UserRole } from 'src/modules/users/domain/enums';

/**
 * Command to update a user's roles
 * Sent by the admin controller (PATCH /users/:id/roles)
 */
export class UpdateUserRolesCommand {
  constructor(
    public readonly userId: string,
    public readonly roles: UserRole[],
  ) {}
}
