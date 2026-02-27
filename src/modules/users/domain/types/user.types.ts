import { Types } from 'mongoose';
import { Email } from '../value-objects/email.value-object';
import { UserName } from '../value-objects/user-name.value-object';
import { AuthProvider, UserRole } from '../enums';

/**
 * UserProps - used INTERNALLY by the private constructor
 *
 * WHAT: The shape the User constructor accepts
 *
 * WHY: It uses value objects `(Email, UserName, etc.)` because by the time we call the constructor, validation has already happened inside the value objects
 *
 * HOW: Only the factory methods (create, fromPersistence) call the constructor, so only they need to build this shape
 */
export interface UserProps {
  id?: Types.ObjectId;
  email: Email;
  name: UserName;
  password?: string | null;
  provider: AuthProvider;
  providerId?: string | null;
  avatar?: string | null;
  roles?: UserRole[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * CreateUserProps - used by the `static create()` factory
 *
 * WHAT: Raw data from the outside world (strings, not value objects)
 *
 * WHY SEPARATE FROM UserProps?
 * - Callers (command handlers) work with raw strings from DTOs
 * - They should not need to know about Email or UserName value objects
 * - That is the entity's job which accept raw data, validate, and construct
 *
 * HOW: `create()` receives this -> builds value objects -> constructs User
 */
export interface CreateUserProps {
  email: string;
  name: string;
  password?: string | null;
  provider: AuthProvider;
  providerId?: string | null;
  avatar?: string | null;
}

/**
 * UserPersistenceProps - used by `fromPersistence()` factory
 *
 * WHAT: The exact shape of raw data coming from MongoDB
 *
 * WHY: When loading from DB, everything is plain strings/dates
 * - This documents exactly what the repository must provide
 *
 * WHO CALLS THIS? Only the repository implementation's `toDomain()` method
 *
 * NOTE: provider and roles are plain strings here because that is what MongoDB stores. `fromPersistence()` casts them to enums
 */
export interface UserPersistenceProps {
  id: Types.ObjectId;
  email: string;
  name: string;
  password?: string | null;
  provider: string;
  providerId?: string | null;
  avatar?: string | null;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * UserToPersistence - used by `toPersistence()` method
 *
 * WHAT: The exact shape of raw data going to MongoDB
 *
 * WHY: When saving to DB, everything is plain strings/dates
 * - This documents exactly what the repository must provide
 */
export interface UserToPersistence {
  _id: Types.ObjectId;
  email: string;
  name: string;
  password: string | null;
  provider: string;
  providerId: string | null;
  avatar: string | null;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * UserResponse - the shape returned to API consumers
 *
 * WHAT: A plain object with NO sensitive data `(no password)`
 *
 * WHY: This REPLACES `sanitizer()` utility function
 * - Instead of stripping fields after the fact, we explicitly define what goes out
 * - The password is never included
 *
 * HOW: The entity's `toResponse()` method builds this shape
 */
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  provider: string;
  providerId?: string | null;
  avatar?: string | null;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}
