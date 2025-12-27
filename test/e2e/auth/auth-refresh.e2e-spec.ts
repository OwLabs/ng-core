import { HttpStatus, INestApplication } from '@nestjs/common';
import { AuthService, RefreshTokenService } from 'src/modules/auth/services';
import { apiEndpoint, closeE2EApp, setupE2EApp } from '../setup.e2e';
import { IUser } from 'src/core/domain/interfaces';
import * as request from 'supertest';
import { ApiVersionEnum } from 'src/api';
import { ENDPOINT_SUBTOPICS, ENDPOINT_TOPICS } from '../constants';

describe('Auth Refresh Tokens', () => {
  let app: INestApplication;

  // Declare service variable
  let authService: AuthService;
  let refreshTokenService: RefreshTokenService;

  // Declare service method variable
  let spyLogin: jest.SpyInstance;
  let spyRegister: jest.SpyInstance;
  let spyValidateUser: jest.SpyInstance;
  let spyValidateRefreshToken: jest.SpyInstance;
  let spyRotateRefreshToken: jest.SpyInstance;
  let spyRevokeTokenById: jest.SpyInstance;
  let spyRevokeAllForUser: jest.SpyInstance;

  // Declare token and user variable
  let accessToken: string;
  let refreshToken: string;
  let user: IUser;

  const userRegisterData = {
    email: 'owlab@example.com',
    name: 'owlab-trying-to-refresh-token',
    password: 'password123',
  };

  beforeAll(async () => {
    const setup = await setupE2EApp();
    app = setup.app;

    authService = app.get(AuthService);
    refreshTokenService = app.get(RefreshTokenService);
  });

  beforeEach(async () => {
    spyLogin = jest.spyOn(authService, 'login');
    spyRegister = jest.spyOn(authService, 'register');
    spyValidateUser = jest.spyOn(authService, 'validateUser');

    spyValidateRefreshToken = jest.spyOn(
      refreshTokenService,
      'validateRefreshToken',
    );
    spyRotateRefreshToken = jest.spyOn(
      refreshTokenService,
      'rotateRefreshToken',
    );
    spyRevokeTokenById = jest.spyOn(refreshTokenService, 'revokeTokenById');
    spyRevokeAllForUser = jest.spyOn(refreshTokenService, 'revokeAllForUser');
  });

  afterEach(async () => {
    spyLogin.mockRestore();
    spyRegister.mockRestore();
    spyValidateUser.mockRestore();

    spyValidateRefreshToken.mockRestore();
    spyRotateRefreshToken.mockRestore();
    spyRevokeTokenById.mockRestore();
    spyRevokeAllForUser.mockRestore();
  });

  afterAll(async () => {
    await closeE2EApp();
  });

  it('should execute full refresh token flow', async () => {
    const { body: userRegisterObj } = await request(app.getHttpServer())
      .post(
        apiEndpoint(
          ApiVersionEnum.V1,
          ENDPOINT_TOPICS.AUTH,
          ENDPOINT_SUBTOPICS.REGISTER,
        ),
      )
      .send(userRegisterData)
      .expect(HttpStatus.CREATED);

    expect(userRegisterObj).toMatchObject({
      _id: expect.any(String),
      email: 'owlab@example.com',
      name: 'owlab-trying-to-refresh-token',
      provider: 'local',
      roles: ['user'],
      createdAt: expect.any(String),
    });

    expect(spyRegister).toHaveBeenCalledTimes(1);

    user = userRegisterObj;

    const { body: userLoginObj } = await request(app.getHttpServer())
      .post(
        apiEndpoint(
          ApiVersionEnum.V1,
          ENDPOINT_TOPICS.AUTH,
          ENDPOINT_SUBTOPICS.LOGIN,
        ),
      )
      .send({
        email: user.email,
        password: 'password123',
      })
      .set('User-Agent', 'supertest-agent/1.0')
      .expect(HttpStatus.CREATED);

    expect(userLoginObj).toMatchObject({
      access_token: expect.any(String),
      newRawToken: expect.any(String),
    });

    accessToken = userLoginObj.access_token;
    refreshToken = userLoginObj.newRawToken;

    expect(spyLogin).toHaveBeenCalledTimes(1);
    expect(spyValidateUser).toHaveBeenCalledTimes(1);

    const { body: refreshTokenObj } = await request(app.getHttpServer())
      .post(
        apiEndpoint(
          ApiVersionEnum.V1,
          ENDPOINT_TOPICS.AUTH,
          ENDPOINT_SUBTOPICS.REFRESH,
        ),
      )
      .send({ refreshToken })
      .expect(HttpStatus.CREATED);

    expect(refreshTokenObj).toMatchObject({
      accessToken: expect.any(String),
      newRefreshToken: expect.any(String),
    });

    expect(spyValidateRefreshToken).toHaveBeenCalledTimes(1);
    expect(spyRotateRefreshToken).toHaveBeenCalledTimes(1);

    refreshToken = refreshTokenObj.newRefreshToken;

    const logoutResponse = await request(app.getHttpServer())
      .post(
        apiEndpoint(
          ApiVersionEnum.V1,
          ENDPOINT_TOPICS.AUTH,
          ENDPOINT_SUBTOPICS.LOGOUT,
        ),
      )
      .send({ refreshToken })
      .expect(HttpStatus.CREATED);

    expect(logoutResponse.body).toEqual({
      message: 'User owlab-trying-to-refresh-token has logged out successfully',
    });

    expect(spyRevokeTokenById).toHaveBeenCalledTimes(1);
  });

  it('should return 401 when refreshToken is missing', async () => {
    const { body: res } = await request(app.getHttpServer())
      .post(
        apiEndpoint(
          ApiVersionEnum.V1,
          ENDPOINT_TOPICS.AUTH,
          ENDPOINT_SUBTOPICS.LOGOUT_ALL_DEVICES,
        ),
      )
      .send({})
      .expect(HttpStatus.UNAUTHORIZED);

    expect(res).toMatchObject({
      message: 'Unauthorized',
      statusCode: 401,
    });
  });
});
