import * as crypto from 'crypto';

export function cryptoRandom(len: number = 16) {
  return crypto.randomBytes(len).toString('hex');
}
