import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from 'src/core/domain/entities';
import { UserRepository } from 'src/core/infrastructure/repositories';
import { AuthService } from 'src/modules/auth/services';
import * as bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { IUser } from 'src/core/domain/interfaces';
import { RefreshTokenService } from 'src/modules/auth/services/refresh-token.service';

describe('AuthService (Unit)', () => {
  let authService: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let userRepo: jest.Mocked<UserRepository>;
  let refreshTokenService: jest.Mocked<RefreshTokenService>;

  beforeEach(() => {
    jwtService = {
      sign: jest.fn().mockReturnValue('fake-jwt-token'),
    } as any;

    refreshTokenService = {
      createToken: jest.fn().mockResolvedValue({ plain: 'fake-refresh-token' }),
    } as any;

    userRepo = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    } as any;

    authService = new AuthService(jwtService, userRepo, refreshTokenService);
  });

  it('should register new user', async () => {
    (userRepo.findByEmail as jest.Mock).mockResolvedValue(null);
    (userRepo.create as jest.Mock).mockResolvedValue({
      email: 'test@example.com',
      password: 'password_is_hashed',
      name: 'unit-test user',
      provider: 'local',
    });

    const result = await authService.register({
      email: 'test@example.com',
      password: 'password123',
      name: 'unit-test user',
    });

    expect(result).toEqual({
      email: 'test@example.com',
      name: 'unit-test user',
      provider: 'local',
    });
  });

  it('should throw if user already exists', async () => {
    (userRepo.findByEmail as jest.Mock).mockResolvedValue({
      email: 'test@example.com',
    });

    // Validate HTTP code 409
    await expect(
      authService.register({
        email: 'test2@example.com',
        password: '123123',
        name: 'testing2',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    // Validate error message received from the response
    await expect(
      authService.register({
        email: 'test@example.com',
        password: '123123',
        name: 'testing2',
      }),
    ).rejects.toThrow('Email already registered');
  });

  describe('validateUser', () => {
    it('should return failure when email not found', async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      const result = await authService.validateUser(
        'not_exist@example.com',
        '123123',
      );

      expect(result).toEqual({
        success: false,
        message: 'Email not found',
      });
    });

    it('should return failure when provider is not local', async () => {
      const googleUser = new UserEntity({
        email: 'google@gmail.com',
        password: null,
        name: 'google-user',
        provider: 'google',
      });

      userRepo.findByEmail.mockResolvedValue(googleUser);

      const result = await authService.validateUser(
        'google@gmail.com',
        '123123',
      );

      expect(result).toEqual({
        success: false,
        message: 'Log in with Google or reset password with "Reset password',
      });
    });

    it('should return failure when password is incorrect', async () => {
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => false);

      const normalUser = new UserEntity({
        email: 'normal@example.com',
        password: 'password_is_hashed',
        name: 'normal-user',
        provider: 'local',
      });

      userRepo.findByEmail.mockResolvedValue(normalUser);

      const result = await authService.validateUser(
        'normal@example.com',
        'hashed',
      );

      expect(result).toEqual({
        success: false,
        message: 'Incorrect password',
      });
    });

    it('should succeed when password is matches', async () => {
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => true);

      const normalUser = new UserEntity({
        _id: new Types.ObjectId('6710f3d40c7b2f4e8d4d9b22'),
        email: 'normal@example.com',
        password: 'hashed',
        name: 'normal-user',
        roles: ['student'],
        provider: 'local',
        providerId: '110392384920384092384',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      userRepo.findByEmail.mockResolvedValue(normalUser);

      const result = await authService.validateUser(
        'normal@example.com',
        'hashed',
      );

      if (!result.success) {
        throw new Error('Expected success');
      }

      expect(result.user._id).toBeInstanceOf(Types.ObjectId);
      expect(result.user._id?.toString()).toBe('6710f3d40c7b2f4e8d4d9b22');
      expect(result).toMatchObject({
        success: true,
        user: {
          avatar: undefined,
          email: 'normal@example.com',
          name: 'normal-user',
          roles: ['student'],
          provider: 'local',
          providerId: '110392384920384092384',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe('login', () => {
    it('should sign JWT correctly', async () => {
      const userId = new Types.ObjectId('6710f3d40c7b2f4e8d4d9b22');
      const ctx = {};

      const user: IUser = {
        _id: userId,
        email: 'test@example.com',
        name: 'test-user',
        roles: ['student'],
      };

      const result = await authService.login(user, ctx);

      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          roles: ['student'],
        }),
      );

      const payload: any = jwtService.sign.mock.calls[0][0];

      expect(payload.sub.toString()).toBe('6710f3d40c7b2f4e8d4d9b22');
      expect(result).toEqual({
        access_token: 'fake-jwt-token',
        newRawToken: 'fake-refresh-token',
      });
    });
  });

  describe('validateGoogleUser', () => {
    const profile = {
      providerId: 'google-123',
      email: 'google@gmail.com',
      name: 'google-user',
      picture: 'avatar.png',
    };

    it('should create and return a new google user when not found', async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      userRepo.create.mockResolvedValue(
        new UserEntity({
          _id: new Types.ObjectId('6710f3d40c7b2f4e8d4d9b22'),
          email: profile.email,
          name: profile.name,
          provider: 'google',
          providerId: profile.providerId,
          avatar: profile.picture,
          roles: ['student'],
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const result = await authService.validateGoogleUser(profile);

      expect(userRepo.create).toHaveBeenCalledTimes(1);

      expect(result._id).toBeInstanceOf(Types.ObjectId);
      expect(result._id?.toString()).toBe('6710f3d40c7b2f4e8d4d9b22');
      expect(result).toMatchObject({
        email: 'google@gmail.com',
        name: 'google-user',
        provider: 'google',
        providerId: 'google-123',
        avatar: 'avatar.png',
        roles: ['student'],
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });
});
