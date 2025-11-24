import { Types } from 'mongoose';

export interface IRefreshToken {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string;
  userAgent?: string;
  ip?: string;
  revoked?: boolean;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
