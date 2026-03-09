import { Injectable } from '@nestjs/common';
import { IOTPTokenRepository } from '../../domain/repositories';
import { OtpToken } from '../../domain/entities';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { OtpToken as OtpTokenSchema } from '../schemas';
import { OtpStatus } from '../../domain/enums/otp-status.enum';

@Injectable()
export class OtpTokenRepositoryImpl implements IOTPTokenRepository {
  constructor(
    @InjectModel(OtpTokenSchema.name)
    private readonly otpTokenModel: Model<OtpTokenSchema>,
  ) {}

  async save(token: OtpToken): Promise<OtpToken> {
    const data = token.toPersistence();
    const created = new this.otpTokenModel(data);
    const saved = await created.save();
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<OtpToken | null> {
    const data = await this.otpTokenModel.findById(id).exec();
    return data ? this.toDomain(data) : null;
  }

  async markAsUsed(id: string): Promise<OtpToken | null> {
    const data = await this.otpTokenModel.findByIdAndUpdate(id, {
      status: OtpStatus.EXPIRED,
    });

    return data ? this.toDomain(data) : null;
  }

  async updateCodeHash(
    id: string,
    newHash: string,
    newExpiry: Date,
  ): Promise<void> {
    await this.otpTokenModel
      .findByIdAndUpdate(id, {
        codeHash: newHash,
        expiresAt: newExpiry,
      })
      .exec();
  }

  async revokeById(id: string): Promise<void> {
    await this.otpTokenModel
      .findByIdAndUpdate(id, {
        status: OtpStatus.REVOKED,
      })
      .exec();
  }

  async update(id: string, token: OtpToken): Promise<OtpToken> {
    const updated = await this.otpTokenModel
      .findByIdAndUpdate(id, token.toPersistence())
      .exec();

    if (!updated) {
      throw new Error('Failed to update OTP token');
    }
    return this.toDomain(updated);
  }

  private toDomain(doc: any): OtpToken {
    return OtpToken.fromPersistence({
      id: doc._id,
      userId: doc._userId,
      email: doc._email,
      codeHash: doc._codeHash,
      attempts: doc._attempts,
      maxAttempts: doc._maxAttempts,
      resendCount: doc._resendCount,
      maxResends: doc._maxResends,
      status: doc._status,
      expiresAt: doc._expiresAt,
    });
  }
}
