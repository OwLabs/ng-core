import { OtpToken } from '../entities';

export const OTP_TOKEN_REPOSITORY = Symbol('OTP_TOKEN_REPOSITORY');

export interface IOtpTokenRepository {
  save(token: OtpToken): Promise<OtpToken>;
  findById(id: string): Promise<OtpToken | null>;
  revokeById(id: string): Promise<void>;
  update(token: OtpToken): Promise<OtpToken>;
}
