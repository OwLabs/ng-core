/**
 * WHAT: How the user signed up / logged in
 *
 * WHY SEPARATE FILE? Single Responsibility Principle (SRP)
 * - Each file has one job. UserRole = what they can do
 * - AuthProvider = how they authenticated
 *
 * WHY IN USERS DOMAIN? Because provider is a property of the User
 * - Auth module USES this enum, but Users OWNS it
 * - Think: "the user IS a google user" (user property)
 * - Not "google authenticated this request" (auth concern)
 */
export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
}
