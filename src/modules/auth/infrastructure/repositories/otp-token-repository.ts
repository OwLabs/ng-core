import { Injectable } from '@nestjs/common';
import { IOtpTokenRepository } from '../../domain/repositories';
import { OtpToken } from '../../domain/entities';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { OtpToken as OtpTokenSchema } from '../schemas';
import { OtpStatus } from '../../domain/enums';

@Injectable()
export class OtpTokenRepositoryImpl implements IOtpTokenRepository {
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

  async revokeById(id: string): Promise<void> {
    await this.otpTokenModel
      .findByIdAndUpdate(id, {
        status: OtpStatus.REVOKED,
      })
      .exec();
  }

  async update(token: OtpToken): Promise<OtpToken> {
    const data = token.toPersistence();
    const updated = await this.otpTokenModel
      .findByIdAndUpdate(data._id, data, { new: true })
      .exec();

    if (!updated) {
      throw new Error('Failed to update OTP token');
    }
    return this.toDomain(updated);
  }

  private toDomain(doc: any): OtpToken {
    return OtpToken.fromPersistence({
      id: doc._id,
      userId: doc.userId,
      email: doc.email,
      codeHash: doc.codeHash,
      attempts: doc.attempts ?? 0,
      maxAttempts: doc.maxAttempts ?? 5,
      resendCount: doc.resendCount ?? 0,
      maxResends: doc.maxResends ?? 3,
      status: doc.status ?? OtpStatus.PENDING,
      expiresAt: doc.expiresAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
