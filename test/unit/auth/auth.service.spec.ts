import { ConfigService } from '@nestjs/config';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import {
  AuthService,
  OtpTokenService,
  RefreshTokenService,
} from 'src/modules/auth/services';
import { User } from 'src/modules/users/domain/entities';
import { AuthProvider, UserRole } from 'src/modules/users/domain/enums';
import { UserValidationErrorCodes } from 'src/modules/users/domain/exceptions/users-error.codes';

jest.mock('bcryptjs');

describe('AuthService (Unit)', () => {
  let authService: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;
  let configService: jest.Mocked<ConfigService>;
  let refreshTokenService: jest.Mocked<RefreshTokenService>;
  let otpTokenService: jest.Mocked<OtpTokenService>;

  let localUser: User;
  let googleUser: User;

  beforeAll(() => {
    localUser = User.create({
      email: 'test@example.com',
      name: 'Testing user',
      password: 'hashed',
      provider: AuthProvider.LOCAL,
    });

    googleUser = User.create({
      email: 'google@gmail.com',
      name: 'Google user',
      provider: AuthProvider.GOOGLE,
    });
  });

  beforeEach(() => {
    jwtService = { sign: jest.fn().mockReturnValue('fake-jwt') } as any;

    commandBus = { execute: jest.fn() } as any;
    queryBus = { execute: jest.fn() } as any;

    configService = { get: jest.fn().mockReturnValue(10) } as any;

    refreshTokenService = {
      createToken: jest.fn().mockReturnValue('fake.refresh.token'),
    } as any;

    otpTokenService = {
      generateAndSendOtp: jest
        .fn()
        .mockResolvedValue({ otpTokenId: 'fake-otp-id' }),
    } as any;

    authService = new AuthService(
      jwtService,
      commandBus,
      queryBus,
      configService,
      refreshTokenService,
      otpTokenService,
    );
  });

  describe('register', () => {
    it('should hash password and send CreateUserCommand', async () => {
      commandBus.execute.mockResolvedValue(localUser);

      const result = await authService.register({
        email: 'test@example.com',
        name: 'Testing user',
        password: 'password123',
      });

      expect(commandBus.execute).toHaveBeenCalledTimes(1);

      expect(result).toMatchObject({
        user: {
          id: expect.any(String),
          email: 'test@example.com',
          name: 'Testing user',
          provider: AuthProvider.LOCAL,
          providerId: null,
          isVerified: false,
          avatar: null,
          roles: [UserRole.LIMITED_ACCESS_USER],
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        otpTokenId: 'fake-otp-id',
      });

      expect((result as any).password).toBeUndefined();
    });
  });

  describe('validateUser', () => {
    it('should return failure when email not found', async () => {
      queryBus.execute.mockResolvedValue(null);

      const result = await authService.validateUser('nope@x.com', '123');

      expect(result).toEqual({
        success: false,
        message: 'Email not found',
        errorCode: UserValidationErrorCodes.EMAIL_NOT_FOUND,
      });
    });

    it('should return failure for Google user trying local login', async () => {
      queryBus.execute.mockResolvedValue(googleUser);

      const result = await authService.validateUser(
        googleUser.email.toString(),
        '123456789',
      );

      expect(result).toEqual({
        success: false,
        message: 'This account uses Google login. Please sign in with Google',
        errorCode: UserValidationErrorCodes.ACCOUNT_PROVIDER_MISMATCH,
      });
    });

    it('should return failure when password is wrong', async () => {
      queryBus.execute.mockResolvedValue(localUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await authService.validateUser(
        localUser.email.toString(),
        'wrong-pass',
      );

      expect(result).toEqual({
        success: false,
        message: 'Incorrect password',
        errorCode: UserValidationErrorCodes.INCORRECT_PASSWORD,
      });
    });

    it('should return success when password is correct', async () => {
      const verifySpy = jest
        .spyOn(localUser, 'isVerified', 'get')
        .mockReturnValue(true);

      queryBus.execute.mockResolvedValue(localUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateUser(
        localUser.email.toString(),
        'correct-password',
      );

      expect(result).toEqual({
        success: true,
        user: localUser.toResponse(),
      });

      verifySpy.mockRestore();
    });
  });

  describe('login', () => {
    it('should return accessToken and refreshToken', async () => {
      const result = await authService.login(
        {
          id: localUser.id.toString(),
          email: localUser.email.toString(),
          name: localUser.name.toString(),
          provider: localUser.provider,
          roles: localUser.roles,
          createdAt: localUser.createdAt,
          updatedAt: localUser.updatedAt,
        },
        { userAgent: 'test', ip: '1.1.1.1', tokenTtlDays: 30 },
      );

      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: localUser.id.toString(),
          email: localUser.email.toString(),
          roles: localUser.roles,
        }),
      );

      expect(result).toEqual({
        accessToken: 'fake-jwt',
        refreshToken: 'fake.refresh.token',
      });
    });
  });
});
