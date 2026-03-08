import { Types } from 'mongoose';
import { OtpStatus } from '../enums/otp-status.enum';
import {
  CreateOtpTokenProps,
  OtpTokenPersistenceProps,
  OtpTokenProps,
} from '../types';

export class OtpToken {
  private readonly _id: Types.ObjectId;
  private readonly _userId: Types.ObjectId;
  private readonly _email: string;
  private _codeHash: string;
  private _attempts: number;
  private readonly _maxAttempts: number;
  private _resendCount: number;
  private readonly _maxResends: number;
  private _status: OtpStatus;
  private readonly _expiresAt: Date;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: OtpTokenProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._codeHash = props.codeHash;
    this._attempts = props.attempts;
    this._maxAttempts = props.maxAttempts;
    this._resendCount = props.resendCount;
    this._maxResends = props.maxResends;
    this._status = props.status as OtpStatus;
    this._expiresAt = props.expiresAt;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  static create(props: CreateOtpTokenProps): OtpToken {
    return new OtpToken({
      id: props.id,
      userId:
        typeof props.userId === 'string'
          ? new Types.ObjectId(props.userId)
          : props.userId,
      email: props.email,
      codeHash: props.codeHash,
      attempts: 0,
      maxAttempts: props.maxAttempts ?? 5,
      resendCount: 0,
      maxResends: props.maxResends ?? 3,
      status: props.status ?? OtpStatus.PENDING,
      expiresAt: props.expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: OtpTokenPersistenceProps): OtpToken {
    return new OtpToken({
      id: props.id,
      userId: props.userId,
      email: props.email,
      codeHash: props.codeHash,
      attempts: props.attempts,
      maxAttempts: props.maxAttempts,
      resendCount: props.resendCount,
      maxResends: props.maxResends,
      status: props.status,
      expiresAt: props.expiresAt,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }
  // ===== GETTERS =====
  get id(): Types.ObjectId {
    return this._id;
  }

  get userId(): Types.ObjectId {
    return this._userId;
  }

  get email(): string {
    return this._email;
  }

  get codeHash(): string {
    return this._codeHash;
  }

  get attempts(): number {
    return this._attempts;
  }

  get maxAttempts(): number {
    return this._maxAttempts;
  }

  get resendCount(): number {
    return this._resendCount;
  }

  get maxResends(): number {
    return this._maxResends;
  }

  get status(): OtpStatus {
    return this._status as OtpStatus;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  isExpired(): boolean {
    return this._expiresAt < new Date();
  }

  isMaxAttemptsReached(): boolean {
    return this._attempts >= this._maxAttempts;
  }

  isMaxResendsReached(): boolean {
    return this._resendCount >= this._maxResends;
  }

  incrementAttempts(): void {
    this._attempts++;
  }

  incrementResends(): void {
    this._resendCount++;
  }

  markAsVerified(): void {
    this._status = OtpStatus.VERIFIED;
  }

  revoke(): void {
    this._status = OtpStatus.REVOKED;
  }

  updateCodeHash(newHash: string): void {
    this._codeHash = newHash;
    this._resendCount = 0;
  }

  toPersistence(): OtpTokenPersistenceProps {
    return {
      id: this._id,
      userId: this._userId,
      email: this._email,
      codeHash: this._codeHash,
      attempts: this._attempts,
      maxAttempts: this._maxAttempts,
      resendCount: this._resendCount,
      maxResends: this._maxResends,
      status: this._status,
      expiresAt: this._expiresAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
