/**
 * WHAT: A fixed set of all possible roles in the system
 *
 * WHY HERE instead of in common/decorators/roles.decorator.ts?
 * - Roles are a DOMAIN concept - they describe what a User can do
 * - The '@Roles()' decorator is a NestJS framework helper
 * - Domain concepts go in the domain layer, framework helpers go in common
 *
 * WHY ENUM instead of plain strings?
 * - TypeScript catches typos at compile time
 * - You cannot accidentally write 'admin' - only valid values allowed
 *
 * IMPORTANT: These values MUST match waht is stored in your MongoDB
 * - Existing user schema uses string arrays like ['user']
 * - We are using LIMITED_ACCESS_USER instead of STUDENT because that is our default role to enforce the security of our system
 */
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  STUDENT = 'student',
  TUTOR = 'tutor',
  PARENT = 'parent',
  LIMITED_ACCESS_USER = 'limited_access_user',
}
