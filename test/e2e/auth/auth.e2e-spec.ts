import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { apiEndpoint, closeE2EApp, setupE2EApp } from '../setup.e2e';
import { AuthService } from 'src/modules/auth/services';
import { ApiVersionEnum } from 'src/api';
import { ENDPOINT_SUBTOPICS, ENDPOINT_TOPICS } from '../constants';

describe('AuthModule (E2E)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let spyRegister: jest.SpyInstance;
  let spyLogin: jest.SpyInstance;
  let spyValidate: jest.SpyInstance;

  beforeAll(async () => {
    const setup = await setupE2EApp();
    app = setup.app;

    authService = app.get(AuthService);
  });

  beforeEach(async () => {
    spyRegister = jest.spyOn(authService, 'register');
    spyLogin = jest.spyOn(authService, 'login');
    spyValidate = jest.spyOn(authService, 'validateUser');
  });

  afterEach(async () => {
    spyRegister.mockRestore();
    spyLogin.mockRestore();
    spyValidate.mockRestore();
  });

  afterAll(async () => {
    await closeE2EApp();
  });

  it('should register a new user and then login successfully', async () => {
    const { body } = await request(app.getHttpServer())
      .post(
        apiEndpoint(
          ApiVersionEnum.V1,
          ENDPOINT_TOPICS.AUTH,
          ENDPOINT_SUBTOPICS.REGISTER,
        ),
      )
      .send({
        email: 'testuser@example.com',
        password: 'password123',
        name: 'Test User',
      });

    expect(body).toMatchObject({
      _id: expect.any(String),
      email: 'testuser@example.com',
      name: 'Test User',
      provider: 'local',
      roles: ['user'],
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      __v: 0,
    });

    expect(spyRegister).toHaveBeenCalledTimes(1);

    const res = await request(app.getHttpServer())
      .post(
        apiEndpoint(
          ApiVersionEnum.V1,
          ENDPOINT_TOPICS.AUTH,
          ENDPOINT_SUBTOPICS.LOGIN,
        ),
      )
      .send({
        email: 'testuser@example.com',
        password: 'password123',
      });

    expect(res.status).toEqual(HttpStatus.CREATED);
    expect(res.body).toMatchObject({ access_token: expect.any(String) });
    expect(spyValidate).toHaveBeenCalledTimes(1);
    expect(spyLogin).toHaveBeenCalledTimes(1);
  });

  it('should return 401 Unauthorized when email does not exist', async () => {
    const res = await request(app.getHttpServer())
      .post(
        apiEndpoint(
          ApiVersionEnum.V1,
          ENDPOINT_TOPICS.AUTH,
          ENDPOINT_SUBTOPICS.LOGIN,
        ),
      )
      .send({
        email: 'hello@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(res.body).toEqual({
      message: 'Email not found',
      error: 'Unauthorized',
      statusCode: 401,
    });

    expect(spyValidate).toHaveBeenCalledTimes(1);
    expect(spyLogin).toHaveBeenCalledTimes(0);
  });

  it('should reject invalid credentials or empty password', async () => {
    const sendWithPassword = {
      email: 'testuser@example.com',
      password: 'asd',
    };

    const res = await request(app.getHttpServer())
      .post(
        apiEndpoint(
          ApiVersionEnum.V1,
          ENDPOINT_TOPICS.AUTH,
          ENDPOINT_SUBTOPICS.LOGIN,
        ),
      )
      .send(sendWithPassword);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      message: 'Incorrect password',
      error: 'Unauthorized',
      statusCode: 401,
    });

    expect(spyValidate).toHaveBeenCalledTimes(1);
    expect(spyLogin).toHaveBeenCalledTimes(0);

    // we need to clear this spy because need to perform the real action
    // let say a user first time login but enter the wrong password
    // then the 2nd time action user accidentally submit login without password
    spyValidate.mockClear();
    spyLogin.mockClear();

    const res2 = await request(app.getHttpServer())
      .post(
        apiEndpoint(
          ApiVersionEnum.V1,
          ENDPOINT_TOPICS.AUTH,
          ENDPOINT_SUBTOPICS.LOGIN,
        ),
      )
      .send({ ...sendWithPassword, password: '' });

    expect(res2.status).toEqual(HttpStatus.UNAUTHORIZED);
    expect(res2.body).toEqual({ message: 'Unauthorized', statusCode: 401 });

    expect(spyValidate).toHaveBeenCalledTimes(0);
    expect(spyLogin).toHaveBeenCalledTimes(0);
  });
});
