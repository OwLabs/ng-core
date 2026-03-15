import { AuthProvider } from 'src/modules/users/domain/enums';

/**
 * Command to create a new user
 *
 * WHAT: An instruction that says "create a user with this data."
 * WHY: In CQRS, commands represent INTENTIONS to change state
 *
 * WHO SENDS THIS?
 *   - Auth module (registration, Google OAuth)
 *   - Admin panel (future: manual user creation)
 *
 * password is optional because Google users don't have one
 */
export class CreateUserCommand {
  constructor(
    public readonly email: string,
    public readonly name: string,
    public readonly provider: AuthProvider,
    public readonly password?: string | null,
    public readonly providerId?: string | null,
    public readonly avatar?: string | null,
  ) {}
}
