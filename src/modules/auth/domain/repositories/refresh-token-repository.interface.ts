import { RefreshToken } from '../entities';

/**
 * Same pattern as IUserRepository:
 *   - Symbol token for NestJS DI
 *   - Interface defines WHAT auth needs
 *   - Implementation handles HOW (Mongoose)
 */
export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');

export interface IRefreshTokenRepository {
  /** Save a new refresh token record */
  save(token: RefreshToken): Promise<RefreshToken>;

  /** Find by MongoDB ID (used during token validation) */
  findById(id: string): Promise<RefreshToken | null>;

  /** Find all active (non-revoked) tokens for a user (session list) */
  findActiveByUserId(userId: string): Promise<RefreshToken[]>;

  /** Revoke a single token by ID */
  revokeById(id: string): Promise<RefreshToken | null>;

  /** Revoke ALL tokens for a user (logout all devices) */
  revokeAllForUser(userId: string): Promise<void>;

  /** Update the token hashsh (used during rotation) */
  updateTokenHash(id: string, newHash: string): Promise<void>;
}
