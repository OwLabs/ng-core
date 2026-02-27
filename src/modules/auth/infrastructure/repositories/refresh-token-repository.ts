import { Injectable } from '@nestjs/common';
import { IRefreshTokenRepository } from '../../domain/repositories';
import { InjectModel } from '@nestjs/mongoose';
import { RefreshToken as RefreshTokenSchema } from '../schemas';
import { Model } from 'mongoose';
import { RefreshToken } from '../../domain/entities';

/**
 * RefreshTokenRepositoryImpl — Mongoose implementation
 *
 * SAME PATTERN as UserRepositoryImpl:
 *   - Implements the interface (contract)
 *   - Maps between DB documents and domain entities
 *   - Uses toDomain() private method for conversion
 */
@Injectable()
export class RefreshTokenRepositoryImpl implements IRefreshTokenRepository {
  constructor(
    @InjectModel(RefreshTokenSchema.name)
    private readonly refreshTokenModel: Model<RefreshTokenSchema>,
  ) {}

  async save(token: RefreshToken): Promise<RefreshToken> {
    const data = token.toPersistence();
    const created = new this.refreshTokenModel(data);

    const saved = await created.save();
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<RefreshToken | null> {
    const doc = await this.refreshTokenModel.findById(id).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findActiveByUserId(userId: string): Promise<RefreshToken[]> {
    const docs = await this.refreshTokenModel
      .find({ userId, revoked: false })
      .exec();

    return docs.map((doc) => this.toDomain(doc));
  }

  async revokeById(id: string): Promise<RefreshToken | null> {
    const doc = await this.refreshTokenModel
      .findByIdAndUpdate(id, { revoked: true }, { new: true })
      .exec();

    return doc ? this.toDomain(doc) : null;
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.refreshTokenModel
      .updateMany({ userId }, { revoked: true })
      .exec();
  }

  async updateTokenHash(id: string, newHash: string): Promise<void> {
    await this.refreshTokenModel
      .findByIdAndUpdate(id, { tokenHash: newHash })
      .exec();
  }

  /**
   * Map Mongoose document → domain entity
   */
  private toDomain(doc: any): RefreshToken {
    return RefreshToken.fromPersistence({
      id: doc._id,
      userId: doc.userId,
      tokenHash: doc.tokenHash,
      userAgent: doc.userAgent ?? null,
      ip: doc.ip ?? null,
      revoked: doc.revoked ?? false,
      expiresAt: doc.expiresAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
