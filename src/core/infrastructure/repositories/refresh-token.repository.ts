import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RefreshToken } from '../database/schemas';
import { Model, Types } from 'mongoose';
import { RefreshTokenEntity } from 'src/core/domain/entities/refresh-token.entity';
import { IRefreshToken } from 'src/core/domain/interfaces';

@Injectable()
export class RefreshTokenRepository {
  constructor(
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshToken>,
  ) {}

  async create(payload: {
    userId: Types.ObjectId | string;
    plainTokenHash: string;
    userAgent?: string;
    ip?: string;
    expiresAt: Date;
  }): Promise<RefreshTokenEntity> {
    const createdToken = new this.refreshTokenModel({
      userId: payload.userId,
      tokenHash: payload.plainTokenHash,
      userAgent: payload.userAgent,
      ip: payload.ip,
      expiresAt: payload.expiresAt,
    });

    const saved = await createdToken.save();
    return new RefreshTokenEntity(saved.toObject<IRefreshToken>());
  }

  async updateTokenHash(
    id: string,
    tokenHash: string,
  ): Promise<RefreshTokenEntity | null> {
    const result = await this.refreshTokenModel.findByIdAndUpdate(
      id,
      { tokenHash },
      { new: true },
    );

    return result
      ? new RefreshTokenEntity(result.toObject<IRefreshToken>())
      : null;
  }

  async findById(id: string): Promise<RefreshTokenEntity | null> {
    const result = await this.refreshTokenModel.findById(id).exec();

    return result
      ? new RefreshTokenEntity(result.toObject<IRefreshToken>())
      : null;
  }

  /**
   * @param userId
   * @returns array of active token users
   */
  async findByUserId(userId: string): Promise<RefreshTokenEntity[]> {
    const result = await this.refreshTokenModel
      .find({ userId, revoked: false })
      .exec();

    return result.map(
      (t) => new RefreshTokenEntity(t.toObject<IRefreshToken>()),
    );
  }

  async revokeById(id: string): Promise<RefreshTokenEntity | null> {
    const result = await this.refreshTokenModel
      .findByIdAndUpdate(id, { revoked: true }, { new: true })
      .exec();

    return result
      ? new RefreshTokenEntity(result.toObject<IRefreshToken>())
      : null;
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.refreshTokenModel
      .updateMany({ userId }, { revoked: true })
      .exec();
  }
}
