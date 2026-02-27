import { User } from '../entities';

/**
 * IUserRepository — Interface (contract) for user persistence.
 *
 * === DEPENDENCY INVERSION PRINCIPLE (the D in SOLID) ===
 *
 * WHAT: An interface defining WHAT the domain needs, not HOW
 *
 * WHY: The domain layer should NEVER depend on infrastructure
 *   - Domain doesn't import Mongoose, MongoDB, or any DB library
 *   - Domain says: "I need to save a User" (this interface)
 *   - Infrastructure says: "I'll use Mongoose" (implementation)
 *
 * HOW IT WORKS WITH NestJS DI:
 *   In users.module.ts:
 *     { provide: USER_REPOSITORY, useClass: UserRepositoryImpl }
 *
 *   In handlers:
 *     @Inject(USER_REPOSITORY) private readonly repo: IUserRepository
 *
 *   NestJS sees the token match and injects UserRepositoryImpl.
 *
 * WHY SYMBOL instead of string?
 *   NestJS DI needs a token to identify what to inject
 *   String tokens can collide: 'UserRepository' might exist elsewhere
 *   Symbol('USER_REPOSITORY') is guaranteed globally unique
 */
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface IUserRepository {
  /**
   * Save a user (create if new, update if existing)
   * The implementation checks if the user already exists in DB
   */
  save(user: User): Promise<User>;

  /** Find user by MongoDB ObjectId string */
  findById(id: string): Promise<User | null>;

  /** Find user by email address */
  findByEmail(email: string): Promise<User | null>;

  /** Find user by OAuth provider ID (e.g; Google profile ID) */
  findByProviderId(providerId: string): Promise<User | null>;

  /** Get all users */
  findAll(): Promise<User[]>;
}
