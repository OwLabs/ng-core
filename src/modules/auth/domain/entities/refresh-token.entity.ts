import { Types } from 'mongoose';
import {
  CreateRefreshTokenProps,
  RefreshTokenPersistenceProps,
  RefreshTokenProps,
} from '../types';

/**
 * RefreshToken Entity — OOP version
 *
 * SAME PATTERN as User entity:
 *   - Private fields → getters only (encapsulation)
 *   - Factory methods: create() and fromPersistence()
 *   - Business methods: isExpired(), revoke()
 *   - toPersistence() for saving to DB
 *
 * WHAT IS A REFRESH TOKEN?
 *   When a user logs in, they receive:
 *   1. Access token (JWT, short-lived ~15min–1hr)
 *   2. Refresh token (long-lived ~30 days, stored in DB)
 *
 *   When the access token expires, the client sends the
 *   refresh token to get a new access token. This avoids
 *   forcing the user to re-enter their password.
 *
 *   Security: Refresh tokens are hashed (like passwords)
 *   before storage. Even if the DB leaks, attackers can't
 *   use the hashed values directly.
 */
export class RefreshToken {
  private readonly _id: Types.ObjectId;
  private readonly _userId: Types.ObjectId;
  private readonly _tokenHash: string;
  private readonly _userAgent: string | null;
  private readonly _ip: string | null;
  private _revoked: boolean;
  private readonly _expiresAt: Date;
  private readonly _createdAt: Date;
  private readonly _updatedAt: Date;

  // Private constructor - use factory methods instead
  private constructor(props: RefreshTokenProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._tokenHash = props.tokenHash;
    this._userAgent = props.userAgent;
    this._ip = props.ip;
    this._revoked = props.revoked;
    this._expiresAt = props.expiresAt;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  // ===== FACTORY: CREATE NEW TOKEN =====
  static create(props: CreateRefreshTokenProps): RefreshToken {
    return new RefreshToken({
      id: props.id,
      userId:
        typeof props.userId === 'string'
          ? new Types.ObjectId(props.userId)
          : props.userId,
      tokenHash: props.tokenHash,
      userAgent: props.userAgent ?? null,
      ip: props.ip ?? null,
      revoked: false,
      expiresAt: props.expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // ===== FACTORY: RECONSTITUTE FROM DATABASE =====
  static fromPersistence(props: RefreshTokenPersistenceProps): RefreshToken {
    return new RefreshToken({
      id: props.id,
      userId: props.userId,
      tokenHash: props.tokenHash,
      userAgent: props.userAgent ?? null,
      ip: props.ip ?? null,
      revoked: props.revoked ?? false,
      expiresAt: props.expiresAt,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  // ===== GETTERS =====
  get id(): Types.ObjectId {
    return this._id;
  }

  get userId(): Types.ObjectId {
    return this._userId;
  }

  get tokenHash(): string {
    return this._tokenHash;
  }

  get userAgent(): string | null {
    return this._userAgent;
  }

  get ip(): string | null {
    return this._ip;
  }

  get revoked(): boolean {
    return this._revoked;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ===== BUSINESS METHODS =====
  //
  // "Is this token still valid?" is domain logic.
  // The entity knows its own rules. The service just asks.
  /** Check if the token has passed its expiration date */
  isExpired(): boolean {
    return this._expiresAt < new Date();
  }

  /** Check if this token has been revoked */
  isRevoked(): boolean {
    return this._revoked;
  }

  /** Check if this token is valid (not expired, not revoked) */
  isValid(): boolean {
    return !this.isExpired() && !this.isRevoked();
  }

  /** Revoke this token */
  revoke(): void {
    this._revoked = true;
  }

  // ===== SERIALIZATION =====
  toPersistence(): Record<string, any> {
    return {
      _id: this._id,
      userId: this._userId,
      tokenHash: this._tokenHash,
      userAgent: this._userAgent,
      ip: this._ip,
      revoked: this._revoked,
      expiresAt: this._expiresAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
