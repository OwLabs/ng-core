import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  RefreshTokenRepository,
  UserRepository,
} from 'src/core/infrastructure/repositories';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';
import { cryptoRandom } from 'src/common/utils';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenEntity } from 'src/core/domain/entities';
import { RefreshTokenPayload } from 'src/core/domain/interfaces';
import { UsersService } from 'src/modules/users/services';

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly usersService: UsersService,
    private readonly userRepo: UserRepository,
  ) {}

  async createToken(
    userId: Types.ObjectId | string,
    opts: { userAgent?: string; ip?: string; tokenTtlDays?: number } = {},
  ) {
    const ttlDays = opts.tokenTtlDays ?? 30;
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    const placeHolderHash = await bcrypt.hash('placeholder', 10);

    /**
     * Create an empty DB record first (we only need the ID)
     */
    const preRecord = await this.refreshTokenRepo.create({
      userId,
      plainTokenHash: placeHolderHash,
      userAgent: opts.userAgent,
      ip: opts.ip,
      expiresAt,
    });

    if (!preRecord._id) {
      throw new Error('Refresh token preRecord ID is missing');
    }

    // Generate raw token with ID embedded
    // Format: <tokenId>.<random>
    //
    const randomPart = uuidv4() + '.' + cryptoRandom();
    const plain = `${preRecord._id}.${randomPart}`;

    /**
     * Hash and update
     */
    const hash = await bcrypt.hash(plain, 10);

    await this.refreshTokenRepo.updateTokenHash(preRecord._id.toString(), hash);

    return {
      plain,
      id: preRecord._id?.toString(),
      expiresAt,
    };
  }

  async validateRefreshToken(rawToken: string): Promise<RefreshTokenEntity> {
    const parts = rawToken.split('.');

    if (parts.length < 2) {
      throw new UnauthorizedException('Invalid token format');
    }

    const tokenId = parts[0];
    const record = await this.refreshTokenRepo.findById(tokenId);

    if (!record) {
      throw new UnauthorizedException('Token not found');
    }

    if (record.revoked) {
      if (record.userId) {
        // Possible token theft
        await this.refreshTokenRepo.revokeAllForUser(record.userId?.toString());
      }

      throw new UnauthorizedException('Token has been revoked');
    }

    if (record.expiresAt < new Date()) {
      throw new UnauthorizedException('Token has expired');
    }

    const isMatch = await bcrypt.compare(rawToken, record.tokenHash);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid token');
    }

    return record;
  }

  async rotateRefreshToken(params: {
    refreshToken: string;
    userAgent?: string;
    ip?: string;
  }): Promise<RefreshTokenPayload> {
    const existingRecord = await this.validateRefreshToken(params.refreshToken);

    const user = await this.userRepo.findById(existingRecord.userId.toString());
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // revoke old token
    await this.refreshTokenRepo.revokeById(existingRecord._id!.toString());

    // create new token
    const { plain: newToken } = await this.createToken(user._id!.toString(), {
      userAgent: params.userAgent,
      ip: params.ip,
    });

    // new access token
    const accessToken = this.jwtService.sign({
      sub: user._id,
      email: user.email,
      roles: user.roles,
    });

    return {
      accessToken,
      newRefreshToken: newToken,
      user,
    };
  }

  // get list of active session user (multi login session devices)
  async getActiveSessionByUser(userId: string): Promise<RefreshTokenEntity[]> {
    return this.refreshTokenRepo.findByUserId(userId);
  }

  // Will enhance this method to detect the user IP if someone is revoke its id without existing userId
  async revokeTokenById(id: string): Promise<{ message: string }> {
    const refreshTokenObjDocs = await this.refreshTokenRepo.revokeById(id);

    if (!refreshTokenObjDocs?.userId) {
      return {
        message: `Refresh Token Document with id ${refreshTokenObjDocs?._id} has been revoked successfully`,
      };
    }

    const user = await this.usersService.findById(
      refreshTokenObjDocs?.userId.toString(),
    );

    return { message: `User ${user?.name} has logged out successfully` };
  }

  async revokeAllForUser(userId: string) {
    await this.refreshTokenRepo.revokeAllForUser(userId);
  }
}
