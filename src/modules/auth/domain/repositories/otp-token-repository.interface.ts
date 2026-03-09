import { OtpToken } from '../entities';

export const OTP_TOKEN_REPOSITORY = Symbol('OTP_TOKEN_REPOSITORY');

export interface IOTPTokenRepository {
  save(token: OtpToken): Promise<OtpToken>;
  findById(id: string): Promise<OtpToken | null>;
  markAsUsed(id: string): Promise<OtpToken | null>;
  updateCodeHash(id: string, newHash: string, newExpiry: Date): Promise<void>;
  revokeById(id: string): Promise<void>;
  update(id: string, token: OtpToken): Promise<OtpToken>;
}
