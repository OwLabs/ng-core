/**
 * Query to get a user's own profile
 *
 * WHY SEPARATE from GetUserById?
 *   Semantically different use case. GetProfile is for the user themselves, `GetById` is for admin lookups.
 *   Keeping them separate means you can add different logic later (e.g; profile might include preferences, activity stats, etc)
 */
export class GetUserProfileQuery {
  constructor(public readonly userId: string) {}
}
