import { QueryBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { RefreshToken } from 'src/modules/auth/domain/entities';
import { REFRESH_TOKEN_REPOSITORY } from 'src/modules/auth/domain/repositories';
import { RefreshTokenService } from 'src/modules/auth/services';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/modules/users/domain/entities';
import { AuthProvider } from 'src/modules/users/domain/enums';

describe('RefreshTokenService (Unit)', () => {
  let service: RefreshTokenService;
  let mockRepo: Record<string, jest.Mock>;
  let queryBus: jest.Mocked<QueryBus>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    mockRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findActiveByUserId: jest.fn(),
      revokeById: jest.fn(),
      revokeAllForUser: jest.fn(),
      updateTokenHash: jest.fn(),
    };

    queryBus = { execute: jest.fn() } as any;
    jwtService = { sign: jest.fn().mockReturnValue('fake-jwt') } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        { provide: JwtService, useValue: jwtService },
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: mockRepo },
        { provide: QueryBus, useValue: queryBus },
      ],
    }).compile();

    service = module.get(RefreshTokenService);
  });

  describe('createToken', () => {
    it('should create and return raw token string', async () => {
      mockRepo.save.mockResolvedValue(undefined);

      const result = await service.createToken(new Types.ObjectId(), {
        userAgent: 'test-agent',
        ip: '127.0.0.1',
        tokenTtlDays: 7,
      });

      expect(typeof result).toBe('string');
      expect(result.split('.').length).toBe(3);
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateRefreshToken', () => {
    it('should throw on invalid format (not enough dots < 2)', async () => {
      await expect(service.validateRefreshToken('dots.dots2')).rejects.toThrow(
        'Invalid token format',
      );
    });

    it('should throw when token not found in DB', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        service.validateRefreshToken('validate.dots.dots2'),
      ).rejects.toThrow('Token not found');
    });

    it('should revoke ALL tokens when a revoked token is used', async () => {
      const revokedToken = RefreshToken.create({
        id: new Types.ObjectId(),
        userId: new Types.ObjectId(),
        tokenHash: 'hashed',
        expiresAt: new Date(Date.now() + 86400000), // this represents as until tomorrow
      });

      revokedToken.revoke();

      mockRepo.findById.mockResolvedValue(revokedToken);
      mockRepo.revokeAllForUser.mockResolvedValue(undefined);

      // It will call revokeAllForUser then continue to the expiry check.
      // Since the token hash won't match, it will eventually throw,
      // but we check that revokeAllForUser was called.
      try {
        await service.validateRefreshToken(
          `${revokedToken.id.toString()}.fakeUuid.randomCrypto`,
        );
      } catch (error) {
        expect(error).toHaveProperty('message', 'Refresh token reuse detected');
      }

      expect(mockRepo.revokeAllForUser).toHaveBeenCalledTimes(1);
    });

    it('should throw when token is expired', async () => {
      const expiredToken = RefreshToken.create({
        id: new Types.ObjectId(),
        userId: new Types.ObjectId(),
        tokenHash: 'hashed',
        expiresAt: new Date(Date.now() - 1000), // expired 1 second ago ok
      });

      mockRepo.findById.mockResolvedValue(expiredToken);

      await expect(
        service.validateRefreshToken(
          `${expiredToken.id.toString()}.fakeUuid.randomCrypto`,
        ),
      ).rejects.toThrow('Token has expired');
    });

    it('should throw when hash does not match', async () => {
      const newToken = RefreshToken.create({
        id: new Types.ObjectId(),
        userId: new Types.ObjectId(),
        tokenHash: await bcrypt.hash('correct-token', 10),
        expiresAt: new Date(Date.now() + 86400000),
      });

      mockRepo.findById.mockResolvedValue(newToken);

      await expect(
        service.validateRefreshToken(
          `${newToken.id.toString()}.fakeUuid.randomCrypto`,
        ),
      ).rejects.toThrow('Invalid token');
    });

    it('should return token entity when valid', async () => {
      const tokenId = new Types.ObjectId();
      const rawToken = `${tokenId.toString()}.fakeUuid.randomCrypto`;

      const newToken = RefreshToken.create({
        id: tokenId,
        userId: new Types.ObjectId(),
        tokenHash: await bcrypt.hash(rawToken, 10),
        expiresAt: new Date(Date.now() + 86400000),
      });

      mockRepo.findById.mockResolvedValue(newToken);

      const result = await service.validateRefreshToken(rawToken);

      expect(result).toBe(newToken);
      expect(result.isValid()).toBe(true);
    });
  });

  describe('rotateRefreshToken', () => {
    it('should revoke old token and return new tokens', async () => {
      const tokenId = new Types.ObjectId();
      const rawToken = `${tokenId.toString()}.oldUuid.oldCrypto`;

      const newToken = RefreshToken.create({
        id: tokenId,
        userId: new Types.ObjectId(),
        tokenHash: await bcrypt.hash(rawToken, 10),
        expiresAt: new Date(Date.now() + 86400000),
      });

      mockRepo.findById.mockResolvedValue(newToken);

      const user = User.create({
        email: 'test@example.com',
        name: 'Testing user here',
        provider: AuthProvider.LOCAL,
        password: 'password123',
      });

      queryBus.execute.mockResolvedValue(user);

      mockRepo.revokeById.mockResolvedValue(newToken);
      mockRepo.save.mockResolvedValue(undefined);

      const result = await service.rotateRefreshToken({
        refreshToken: rawToken,
      });

      expect(mockRepo.revokeById).toHaveBeenCalledWith(newToken.id.toString());

      expect(result).toMatchObject({
        accessToken: 'fake-jwt',
        refreshToken: expect.any(String),
      });

      expect(result.refreshToken).not.toBe(rawToken);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: expect.any(String),
          email: 'test@example.com',
          roles: expect.any(Array),
        }),
      );
    });

    it('should throw when user not found after validation', async () => {
      const tokenId = new Types.ObjectId();
      const rawToken = `${tokenId.toString()}.oldUuid.oldCrypto`;

      const newToken = RefreshToken.create({
        id: tokenId,
        userId: new Types.ObjectId(),
        tokenHash: await bcrypt.hash(rawToken, 10),
        expiresAt: new Date(Date.now() + 86400000),
      });

      mockRepo.findById.mockResolvedValue(newToken);

      queryBus.execute.mockResolvedValue(null);

      await expect(
        service.rotateRefreshToken({ refreshToken: rawToken }),
      ).rejects.toThrow('User not found');
    });
  });

  describe('revokeTokenById', () => {
    it('should return success message when token found', async () => {
      mockRepo.revokeById.mockResolvedValue({} as RefreshToken);

      const result = await service.revokeTokenById('some-id');

      expect(result).toMatchObject({
        message: 'Session has been revoked successfully',
      });
    });

    it('should return not found message when token is missing', async () => {
      mockRepo.revokeById.mockResolvedValue(null);

      const result = await service.revokeTokenById('some-id');

      expect(result).toMatchObject({
        message: 'Token some-id not found',
      });
    });
  });

  describe('revokeAllForUser', () => {
    it('should call repo revokeAllForUser', async () => {
      mockRepo.revokeAllForUser.mockResolvedValue(undefined);

      await service.revokeAllForUser('user12323');

      expect(mockRepo.revokeAllForUser).toHaveBeenCalledWith('user12323');
      expect(mockRepo.revokeAllForUser).toHaveBeenCalledTimes(1);
    });
  });
});
