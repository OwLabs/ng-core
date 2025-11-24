import { Types } from 'mongoose';
import { IRefreshToken } from '../interfaces';

export class RefreshTokenEntity implements IRefreshToken {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string;
  userAgent?: string;
  ip?: string;
  revoked?: boolean;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(partial: Partial<IRefreshToken>) {
    Object.assign(this, partial);
  }
}
