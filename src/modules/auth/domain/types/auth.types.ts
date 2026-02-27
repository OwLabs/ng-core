import { Type } from '@nestjs/common';
import { Types } from 'mongoose';
import { UserResponse } from 'src/modules/users/domain/types';

/**
 * AuthResult — discriminated union for login validation
 *
 * WHY DISCRIMINATED UNION?
 *   TypeScript can narrow the type based on `success`:
 *     if (result.success) {
 *       result.user  ← TypeScript KNOWS user exists here
 *     } else {
 *       result.message  ← TypeScript KNOWS message exists here
 *     }
 *
 *   This is safer than `{ success: boolean; user?: IUser; message?: string }`
 *   where you'd have to check both fields manually
 */
export type AuthResult =
  | { success: true; user: UserResponse }
  | { success: false; message: string };

/**
 * TokenPayload - what gets signed into the JWT
 */
export interface TokenPayload {
  sub: string; // user ID (JWT standard: "subject")
  email: string;
  roles: string[];
}

/**
 * AuthTokens - the pair returned after login
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * RefreshTokenProps - internal entity constructor shape
 */
export interface RefreshTokenProps {
  id: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string;
  userAgent: string | null;
  ip: string | null;
  revoked: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * CreateRefreshTokenProps - shape for factory method
 */
export interface CreateRefreshTokenProps {
  id: Types.ObjectId;
  userId: Types.ObjectId | string;
  tokenHash: string;
  userAgent?: string | null;
  ip?: string | null;
  expiresAt: Date;
}

/**
 * RefreshTokenPersistenceProps - DB document → entity
 */
export interface RefreshTokenPersistenceProps {
  id: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string;
  userAgent?: string | null;
  ip?: string | null;
  revoked?: boolean;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
