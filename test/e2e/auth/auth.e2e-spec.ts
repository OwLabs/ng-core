import { HttpStatus, INestApplication } from '@nestjs/common';
import {
  apiEndpoint,
  closeE2EApp,
  setupE2EApp,
} from '../_support/setup/e2e-app.helper';
import request from 'supertest';
import { ApiVersionEnum } from 'src/common/config';
import { ACTIONS, TOPICS } from '../_support/constants';
import { UserRole } from 'src/modules/users/domain/enums';

/**
 * Study the comments, then write it yourself
 */
describe('Auth Module E2E', () => {
  let app: INestApplication;

  /**
   * WHY beforeAll not beforeEach?
   * Creating a NestJS app is expensive (~1-3s).
   * We create it ONCE for all tests in this describe block.
   * Each test gets a fresh state through the database, not a fresh app.
   */
  beforeAll(async () => {
    const setup = await setupE2EApp();
    app = setup.app;
  });

  afterAll(async () => {
    // kasi dc and close mongo bro (wajib)
    await closeE2EApp();
  });

  // ===== REGISTER =====
  it('should register a new user', async () => {
    const { body } = await request(app.getHttpServer())
      .post(apiEndpoint(ApiVersionEnum.V1, TOPICS.AUTH, ACTIONS.REGISTER))
      .send({
        name: 'Chad',
        email: 'chad@example.com',
        password: 'password123',
      })
      .expect(HttpStatus.CREATED);

    expect(body).toMatchObject({
      id: expect.any(String),
      email: 'chad@example.com',
      name: 'Chad',
      provider: 'local',
      roles: [UserRole.LIMITED_ACCESS_USER],
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    // this is because we dont show user's password back to frontend
    // sangat redflag kalau expose password to client side
    expect(body.password).toBeUndefined();
  });

  // ===== LOGIN (success) =====
  it('should login and return tokens', async () => {
    const { body } = await request(app.getHttpServer())
      .post(apiEndpoint(ApiVersionEnum.V1, TOPICS.AUTH, ACTIONS.LOGIN))
      .send({
        email: 'chad@example.com',
        password: 'password123',
      })
      .expect(HttpStatus.CREATED);

    expect(body).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
  });

  // ===== LOGIN (wrong email) =====
  it('should return 401 when email does not exist', async () => {
    const { body } = await request(app.getHttpServer())
      .post(apiEndpoint(ApiVersionEnum.V1, TOPICS.AUTH, ACTIONS.LOGIN))
      .send({
        email: 'bob_haziq@gmail.com',
        password: 'password123',
      })
      .expect(HttpStatus.UNAUTHORIZED);

    expect(body.message).toBe('Email not found');
  });

  // ===== LOGIN (wrong password) =====
  it('should return 401 for incorrect password', async () => {
    const { body } = await request(app.getHttpServer())
      .post(apiEndpoint(ApiVersionEnum.V1, TOPICS.AUTH, ACTIONS.LOGIN))
      .send({
        email: 'chad@example.com',
        password: 'iman-muhammad-ali@hotmail.com',
      })
      .expect(HttpStatus.UNAUTHORIZED);

    expect(body.message).toBe('Incorrect password');
  });
});
