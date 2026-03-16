import * as crypto from 'crypto';

export function cryptoRandom(len: number = 16) {
  return crypto.randomBytes(len).toString('hex');
}

export function generateOtp(length = 6): string {
  const min = 10 ** (length - 1);
  const max = 10 ** length;
  return crypto.randomInt(min, max).toString();
}
