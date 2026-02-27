import { Types } from 'mongoose';
import { Email } from '../value-objects/email.value-object';
import { UserName } from '../value-objects/user-name.value-object';
import { AuthProvider, UserRole } from '../enums';
import {
  CreateUserProps,
  UserPersistenceProps,
  UserProps,
  UserResponse,
  UserToPersistence,
} from '../types';

/**
 * User Entity - The heart of the Users domain
 * ---
 * OOP CONCEPTS APPLIED
 *
 *
 * 1. ENCAPSULATION (private properties + getters)
 *    - All properties are private. Outside code cannot do: `user._email = "new@email.com"`
 *    - Public getters provide read-only access
 *    - State changes go through business methods with validation
 * ---
 * 2. FACTORY PATTERN (static create + fromPersistence)
 *    - Constructor is private - you cannot do `new User()` from outside
 *    - `create()` is for NEW users (generates ID, sets defaults)
 *    - `fromPersistence()` is for EXISTING users from the database
 *    - This ensures a User is ALWAYS a valid state
 * ---
 * 3. RICH DOMAIN MODEL (behavior, not just data)
 *    - `updateRoles()` contains business rules
 *    - `hasRole(), isAdmin()` express domain knowledge
 *    - `toResponse()` controls what data leaves the entity
 * ---
 *
 * Compare to our old UserEntity which was just:
 *      class UserEntity
 *      {
 *          email: string;
 *          ...
 *          constructor(partial) {
 *              Object.assign(this, partial);
 *          }
 *      }
 *
 * That is an "anemic model" - data bag with no behaviour
 */
export class User {
  // This is private properties
  // Nobody outside this class can read or modify these directly
  // This is ENCAPSULATION — the #1 principle of OOP
  private readonly _id: Types.ObjectId;
  private _email: Email;
  private _name: UserName;
  private _password: string | null;
  private _provider: AuthProvider;
  private _providerId: string | null;
  private _avatar: string | null;
  private _roles: UserRole[];
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  // This is private constructor (use of factory methods)
  // Nobody can write `new User(...)` from outside
  // They MUST use create() or fromPersistence()
  // This guarantees every User instance passes through our validation
  private constructor(props: UserProps) {
    this._id = props.id ?? new Types.ObjectId();
    this._email = props.email;
    this._name = props.name;
    this._password = props.password ?? null;
    this._provider = props.provider;
    this._providerId = props.providerId ?? null;
    this._avatar = props.avatar ?? null;
    this._roles = props.roles ?? [UserRole.LIMITED_ACCESS_USER];
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  // ===== FACTORY: CREATE NEW USER =====
  //
  // WHY ONE create() instead of createLocal/createOAuth?
  //   The entity doesn't care HOW you authenticated.
  //   It just needs valid data to construct a User.
  //   - Local registration? Caller passes password + provider = LOCAL
  //   - Google OAuth? Caller passes providerId + provider = GOOGLE
  //   The auth module decides what to pass. The entity validates it.
  //
  // HOW IT WORKS:
  //   1. Receives raw strings (from CreateUserProps)
  //   2. Creates value objects (Email.create, UserName.create)
  //      - validation happens here automatically
  //   3. Passes validated data to private constructor
  //   4. Returns a guaranteed-valid User instance
  static create(props: CreateUserProps): User {
    const email = Email.create(props.email);
    const name = UserName.create(props.name);

    return new User({
      email,
      name,
      password: props.password ?? null,
      provider: props.provider,
      providerId: props.providerId ?? null,
      avatar: props.avatar ?? null,
      roles: [UserRole.LIMITED_ACCESS_USER],
    });
  }

  // ===== FACTORY: RECONSTITUTE FROM DATABASE =====
  //
  // WHAT: Rebuilds a User from stored data (MongoDB document)
  // WHY SEPARATE FROM create()?
  //  create() is for NEW users (generates fresh ID, default roles)
  //  fromPersistence() is for EXISTING users (uses stored ID, stored roles)
  // WHO CALLS THIS? Only the repository implementation (toDomain method)
  static fromPersistence(props: UserPersistenceProps): User {
    return new User({
      id: props.id,
      email: Email.create(props.email),
      name: UserName.create(props.name),
      password: props.password ?? null,
      provider: props.provider as AuthProvider,
      providerId: props.providerId ?? null,
      avatar: props.avatar ?? null,
      roles: props.roles.map((r) => r as UserRole),
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  // ===== GETTERS (Read-Only Access) =====
  //
  // WHY GETTERS instead of public properties?
  //   With public property:   user.email = "anything"  → ALLOWED (bad!)
  //   With getter:            user.email               → reads value
  //                           user.email = "anything"  → TypeScript ERROR
  //
  // The `get` keyword makes it look like a property to the caller,
  // but it's actually a method that only returns — no setting allowed

  get id(): Types.ObjectId {
    return this._id;
  }

  get email(): Email {
    return this._email;
  }

  get name(): UserName {
    return this._name;
  }

  get provider(): AuthProvider {
    return this._provider;
  }

  get avatar(): string | null {
    return this._avatar;
  }

  get roles(): UserRole[] {
    // WHY [...this._roles] (spread)?
    // Return a COPY so nobody can mutate our internal array
    // Without the spread: user.roles.push('hacker') would modify the entity!
    // With the spread: user.roles.push('hacker') only modifies the copy
    return [...this._roles];
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ===== BUSINESS METHODS =====
  //
  // These are WHERE DOMAIN LOGIC LIVES
  // Your old code put all logic in UsersService. In DDD, business
  // rules about the User go IN the User entity

  /**
   * Update user roles with validation.
   *
   * WHY HERE and not in the service/handler?
   *   The rule "user must have at least one role" is a business rule
   *   ABOUT the User entity. It belongs where the data is
   *   The handler orchestrates (load → change → save)
   *   The entity validates (is this change legal?)
   */
  updateRoles(newRoles: UserRole[]): void {
    if (newRoles.length === 0) {
      throw new Error('User must have at least one role');
    }

    this._roles = [...newRoles];
    this.touch();
  }

  /**
   * Change user name. UserName value object handles validation
   */
  changeName(newName: UserName): void {
    this._name = newName;
    this.touch();
  }

  /** Change user email. Email value object handles validation */
  changeEmail(newEmail: Email): void {
    this._email = newEmail;
    this.touch();
  }

  /** Update avatar URL */
  updateAvatar(avatarUrl: string | null): void {
    this._avatar = avatarUrl;
    this.touch();
  }

  /**
   * Check if user has a specific role.
   * Encapsulates the array check, callers just ask "hasRole?"
   */
  hasRole(role: UserRole): boolean {
    return this._roles.includes(role);
  }

  /**
   * Check if user is admin (admin or super_admin)
   * This is domain knowledge — "admin" means either role
   */
  isAdmin(): boolean {
    return this.hasRole(UserRole.SUPER_ADMIN) || this.hasRole(UserRole.ADMIN);
  }

  /**
   * Get password hash — ONLY for authentication checks.
   * WHY A METHOD instead of a getter?
   *   To make access explicit. A getter named `password`
   *   might be accidentally serialized in JSON.stringify().
   *   With a method, you must consciously call getPasswordHash().
   */
  getPasswordHash(): string | null {
    return this._password;
  }

  // ===== SERIALIZATION =====

  /**
   * Convert to API response format (NO password)
   * This REPLACES the sanitizeUser() utility function
   * The entity itself decides what data goes out — encapsulation!
   */
  toResponse(): UserResponse {
    return {
      id: this._id.toString(),
      email: this._email.getValue(),
      name: this._name.getValue(),
      provider: this._provider,
      providerId: this._providerId,
      avatar: this._avatar,
      roles: [...this._roles],
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  /**
   * Convert to plain object for database persistence
   * This INCLUDES password because the DB needs to store it
   * Only the repository calls this — never exposed to HTTP
   */
  toPersistence(): UserToPersistence {
    return {
      _id: this._id,
      email: this._email.getValue(),
      name: this._name.getValue(),
      password: this._password,
      provider: this._provider,
      providerId: this._providerId,
      avatar: this._avatar,
      roles: [...this._roles],
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  // ===== PRIVATE METHOD =====

  /**
   * Update the updatedAt timestamp
   * WHY PRIVATE? Only the entity itself should call this
   * It fires automatically when state changes (updateRoles, changeName, etc.)
   * Outside code can never manually set updatedAt
   */
  private touch(): void {
    this._updatedAt = new Date();
  }
}
