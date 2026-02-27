/**
 * Query to find a user by email
 * Used by the auth module when checking login credentials
 */
export class GetUserByEmailQuery {
  constructor(public readonly email: string) {}
}
