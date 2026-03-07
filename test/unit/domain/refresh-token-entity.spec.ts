import { Types } from 'mongoose';
import { RefreshToken } from 'src/modules/auth/domain/entities';

let token: RefreshToken;

const createToken = (overrides = {}) =>
  RefreshToken.create({
    id: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    tokenHash: 'hashedvalue',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    ...overrides,
  });

beforeEach(() => {
  token = createToken();
});

describe('RefreshToken Entity', () => {
  it('should create a non-revoked, non-expired token', () => {
    token = createToken();
    expect(token.isRevoked()).toBe(false);
    expect(token.isExpired()).toBe(false);
    expect(token.isValid()).toBe(true);
  });

  it('should detect expired token', () => {
    token = createToken({
      expiresAt: new Date(Date.now() - 1000), // expired 1s ago
    });
    expect(token.isExpired()).toBe(true);
    expect(token.isValid()).toBe(false);
  });

  it('should revoke token', () => {
    token = createToken();
    token.revoke();
    expect(token.isRevoked()).toBe(true);
    expect(token.isValid()).toBe(false);
  });
});
