import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import {
  RefreshTokenRepository,
  UserRepository,
} from 'src/core/infrastructure/repositories';
import { RefreshTokenService } from 'src/modules/auth/services';
import { UsersService } from 'src/modules/users/services';
import * as bcrypt from 'bcryptjs';
import { UnauthorizedException } from '@nestjs/common';

describe('RefreshTokenService (Unit', () => {
  let refreshTokenService: RefreshTokenService;
  let refreshTokenRepo: jest.Mocked<RefreshTokenRepository>;
  let userRepo: jest.Mocked<UserRepository>;
  let jwtService: JwtService;

  const mockRefreshTokenRepo = (): jest.Mocked<RefreshTokenRepository> =>
    ({
      create: jest.fn(),
      updateTokenHash: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      revokeById: jest.fn(),
      revokeAllForUser: jest.fn(),
    }) as any;

  const mockUserRepo = (): jest.Mocked<UserRepository> =>
    ({
      findById: jest.fn(),
    }) as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        RefreshTokenService,
        JwtService,
        { provide: RefreshTokenRepository, useFactory: mockRefreshTokenRepo },
        { provide: UserRepository, useFactory: mockUserRepo },
      ],
    }).compile();

    refreshTokenService = module.get(RefreshTokenService);
    refreshTokenRepo = module.get(RefreshTokenRepository);
    userRepo = module.get(UserRepository);
    jwtService = module.get(JwtService);
  });

  describe('createToken', () => {
    it('should create a new refresh token record and return plain token', async () => {
      const userId = new Types.ObjectId().toString();

      refreshTokenRepo.create.mockResolvedValue({
        _id: 'Token123Sample',
        tokenHash: 'placeholder',
      } as any);

      refreshTokenRepo.updateTokenHash.mockResolvedValue({} as any);

      const result = await refreshTokenService.createToken(userId, {
        userAgent: 'VSCode/1.1',
        ip: '1.1.1.1',
        tokenTtlDays: 30,
      });

      expect(refreshTokenRepo.create).toHaveBeenCalledTimes(1);
      expect(refreshTokenRepo.updateTokenHash).toHaveBeenCalledTimes(1);

      const parts = result.plain.split('.');
      expect(parts).toHaveLength(3);

      expect(parts[0]).toBe('Token123Sample');
      expect(parts[1]).toEqual(expect.any(String));
      expect(parts[2]).toEqual(expect.any(String));

      expect(result.id).toBe('Token123Sample');
    });
  });

  describe('validateRefreshToken', () => {
    it('should validate a valid refresh token', async () => {
      const rawToken = 'abc123.random';
      const savedHashToken = await bcrypt.hash(rawToken, 10);

      refreshTokenRepo.findById.mockResolvedValue({
        _id: 'abc123',
        tokenHash: savedHashToken,
        revoked: false,
        expiresAt: new Date(Date.now() + 10000),
      } as any);

      const result = await refreshTokenService.validateRefreshToken(rawToken);

      expect(refreshTokenRepo.findById).toHaveBeenCalledWith('abc123');
      expect(result._id).toBe('abc123');
    });

    it('should throw if token is revoked', async () => {
      refreshTokenRepo.findById.mockResolvedValue({
        revoked: true,
      } as any);

      await expect(
        refreshTokenService.validateRefreshToken('trueRevokedToken.random'),
      ).rejects.toThrow(new UnauthorizedException('Token has been revoked'));
    });

    it('should throw if token is expired', async () => {
      refreshTokenRepo.findById.mockResolvedValue({
        revoke: false,
        expiresAt: new Date(Date.now() - 10000),
      } as any);

      await expect(
        refreshTokenService.validateRefreshToken('expiredToken.random'),
      ).rejects.toThrow(new UnauthorizedException('Token has expired'));
    });

    it('should throw if hash mismatch', async () => {
      refreshTokenRepo.findById.mockResolvedValue({
        revoked: false,
        expiresAt: new Date(Date.now() + 10000),
        tokenHash: await bcrypt.hash('true.token', 10),
      } as any);

      await expect(
        refreshTokenService.validateRefreshToken('wrong.token'),
      ).rejects.toThrow(new UnauthorizedException('Invalid token'));
    });

    describe('rotateRefreshToken', () => {
      it('should revoke old token and create new token', async () => {
        const rawToken = 'zzz.sleeping';
        const hashed = await bcrypt.hash(rawToken, 10);

        refreshTokenRepo.findById.mockResolvedValue({
          _id: 'abc123',
          userId: 'user_is_sleeping',
          tokenHash: hashed,
          revoked: false,
          expiresAt: new Date(Date.now() + 10000),
        } as any);

        userRepo.findById.mockResolvedValue({
          _id: 'user_is_sleeping',
          email: 'aiman@ashley.com',
          roles: ['super_admin'],
        } as any);

        refreshTokenRepo.revokeById.mockResolvedValue({} as any);

        jest.spyOn(refreshTokenService, 'createToken').mockResolvedValue({
          plain: 'new.refresh.token',
          id: 'newRefreshTokenId',
          expiresAt: new Date(Date.now() + 10000),
        });

        jest
          .spyOn(jwtService, 'sign')
          .mockResolvedValue('new.access.token' as never);

        const res = await refreshTokenService.rotateRefreshToken({
          refreshToken: rawToken,
          userAgent: 'Mozilla',
          ip: '1.1.1.1',
        });

        expect(refreshTokenRepo.revokeById).toHaveBeenCalledWith('abc123');
        expect(refreshTokenService.createToken).toHaveBeenCalledWith(
          'user_is_sleeping',
          {
            userAgent: 'Mozilla',
            ip: '1.1.1.1',
          },
        );

        expect(res.accessToken).toBeDefined();
        expect(res.newRefreshToken).toBe('new.refresh.token');
      });
    });

    describe('revoke operations', () => {
      it('should revoke a single token', async () => {
        refreshTokenRepo.revokeById.mockResolvedValue({} as any);

        await refreshTokenService.revokeTokenById('abc');

        expect(refreshTokenRepo.revokeById).toHaveBeenCalledWith('abc');
      });

      it('should revole all tokens for a user', async () => {
        refreshTokenRepo.revokeAllForUser.mockResolvedValue();

        await refreshTokenService.revokeAllForUser('user123');

        expect(refreshTokenRepo.revokeAllForUser).toHaveBeenCalledWith(
          'user123',
        );
      });
    });
  });
});
