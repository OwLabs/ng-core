import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '../domain/repositories';
import { Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { cryptoRandom } from 'src/common/utils';
import { RefreshToken } from '../domain/entities';
import { AuthTokens, TokenPayload } from '../domain/types';
import { User } from 'src/modules/users/domain/entities';
import { GetUserByIdQuery } from 'src/modules/users/application/queries/impl';

/**
 * RefreshTokenService — refactored
 *
 * BUGS FIXED:
 *   - Placeholder hash race condition → single atomic create
 *   - Inconsistent DI (UsersService + UserRepository) → QueryBus only
 *   - Unnecessary DB call for username → generic message
 *   - Uses IRefreshTokenRepository interface (DI)
 *   - Uses RefreshToken entity methods (isExpired, isRevoked)
 */
@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly queryBus: QueryBus,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: IRefreshTokenRepository,
  ) {}

  /**
   * Create a new refresh token
   *
   * SECURITY FIX: No more placeholder hash
   *
   * OLD (vulnerable):
   *   1. Create DB record with placeholder hash ← attackable window!
   *   2. Generate real token
   *   3. Hash and update record
   *
   * NEW (secure):
   *   1. Generate ID upfront
   *   2. Generate token with that ID
   *   3. Hash the token
   *   4. Create DB record with REAL hash (single atomic write)
   */
  async createToken(
    userId: Types.ObjectId | string,
    opts: { userAgent?: string; ip?: string; tokenTtlDays?: number } = {},
  ): Promise<string> {
    const ttlDays = opts.tokenTtlDays ?? 30;
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    // Step 1: Generate a fresh ID
    const tokenId = new Types.ObjectId();

    // Step 2: Build the raw token (this is what the client stores)
    const randomPart = uuidv4() + '.' + cryptoRandom();
    const rawToken = `${tokenId}.${randomPart}`;

    // Step 3: Hash it (this is what the DB stores)
    const hash = await bcrypt.hash(rawToken, 10);

    // Step 4: Create entity and save - NO placeholder, real hash from start
    const token = RefreshToken.create({
      id: tokenId,
      userId,
      tokenHash: hash,
      userAgent: opts.userAgent,
      ip: opts.ip,
      expiresAt,
    });

    await this.refreshTokenRepo.save(token);

    // Return the raw token (client will send this back on refresh)
    return rawToken;
  }

  /**
   * Validate a refresh token from the client
   *
   * IMPROVED: Uses entity business methods (isRevoked, isExpired)
   * instead of raw property checks
   */
  async validateRefreshToken(rawToken: string): Promise<RefreshToken> {
    const parts = rawToken.split('.');

    if (parts.length < 2) {
      throw new UnauthorizedException('Invalid token format');
    }

    const tokenId = parts[0];
    const record = await this.refreshTokenRepo.findById(tokenId);

    if (!record) {
      throw new UnauthorizedException('Token not found');
    }

    // Entity methods encapsulate the validation logic:
    if (record.isRevoked()) {
      // Possible token theft - revoke ALL tokens for this user
      await this.refreshTokenRepo.revokeAllForUser(record.userId.toString());
    }

    if (record.isExpired()) {
      throw new UnauthorizedException('Token has expired');
    }

    const isMatch = await bcrypt.compare(rawToken, record.tokenHash);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid token');
    }

    return record;
  }

  /**
   * Rotate refresh token (revoke old, issue new)
   *
   * FIXED:
   *   - Uses QueryBus instead of direct UserRepository
   *   - Uses entity getters instead of raw properties
   *   - Returns proper AuthTokens type
   */
  async rotateRefreshToken(params: {
    refreshToken: string;
    userAgent?: string;
    ip?: string;
  }): Promise<AuthTokens> {
    const existingRecord = await this.validateRefreshToken(params.refreshToken);

    // Use QueryBus to look up user (proper module boundary)
    const user: User = await this.queryBus.execute(
      new GetUserByIdQuery(existingRecord.userId.toString()),
    );

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Revoke old token
    await this.refreshTokenRepo.revokeById(existingRecord.id.toString());

    // Create new refresh token
    const newRefreshToken = await this.createToken(user.id.toString(), {
      userAgent: params.userAgent,
      ip: params.ip,
    });

    // Generate new access token using entity getters
    const payload: TokenPayload = {
      sub: user.id.toString(),
      email: user.email.getValue(),
      roles: user.roles,
    };

    const accessToken = this.jwtService.sign(payload);

    return { accessToken, refreshToken: newRefreshToken };
  }

  /**
   * Get active sessions for a user (multi-device login list)
   */
  async getActiveSessionByUser(userId: string): Promise<RefreshToken[]> {
    return this.refreshTokenRepo.findActiveByUserId(userId);
  }

  /**
   * Revoke a single token by ID
   *
   * FIXED: Removed unnecessary DB call to fetch username
   */
  async revokeTokenById(id: string): Promise<{ message: string }> {
    const token = await this.refreshTokenRepo.revokeById(id);

    return {
      message: token
        ? 'Session hgas been revoked successfully'
        : `Token ${id} not found`,
    };
  }

  /**
   * Revoke all tokens for a user (logout from all devices)
   */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.refreshTokenRepo.revokeAllForUser(userId);
  }
}
