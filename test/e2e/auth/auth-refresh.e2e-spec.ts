import { HttpStatus, INestApplication } from '@nestjs/common';
import {
  apiEndpoint,
  closeE2EApp,
  setupE2EApp,
} from '../_support/setup/e2e-app.helper';
import { registerAndLogin, RegisterAndLoginResult } from '../_support/helpers';
import request from 'supertest';
import { ApiVersionEnum } from 'src/common/config';
import { ACTIONS, TOPICS } from '../_support/constants';

describe('Auth Refresh Tokens E2E', () => {
  let app: INestApplication;
  let data: RegisterAndLoginResult | null;

  beforeAll(async () => {
    const setup = await setupE2EApp();
    app = setup.app;

    data = await registerAndLogin(app, {
      email: 'syafiq_feroz@gmail.com',
      name: 'Syafiq Feroz',
      password: 'password123',
    });
  });

  afterAll(async () => {
    await closeE2EApp();
  });

  it('should rotate refresh token and get new tokens', async () => {
    const { body } = await request(app.getHttpServer())
      .post(apiEndpoint(ApiVersionEnum.V1, TOPICS.AUTH, ACTIONS.REFRESH))
      .send({ refreshToken: data?.refreshToken })
      .expect(HttpStatus.CREATED);

    expect(body).toMatchObject({
      accessToken: body.accessToken,
      refreshToken: body.refreshToken,
    });

    expect(body.refreshToken).not.toBe(data?.refreshToken);
  });

  it('should logout successfully', async () => {
    const { body } = await request(app.getHttpServer())
      .post(apiEndpoint(ApiVersionEnum.V1, TOPICS.AUTH, ACTIONS.LOGOUT))
      .send({ refreshToken: data?.refreshToken })
      .expect(HttpStatus.CREATED);

    expect(body).toMatchObject({
      message: 'Session has been revoked successfully',
    });
  });

  it('should logout all devices successfully with existing JWT tokens', async () => {
    const { body } = await request(app.getHttpServer())
      .post(
        apiEndpoint(ApiVersionEnum.V1, TOPICS.AUTH, ACTIONS.LOGOUT_ALL_DEVICES),
      )
      .auth(data?.accessToken as string, { type: 'bearer' })
      .expect(HttpStatus.CREATED);

    expect(body).toMatchObject({
      message: 'Logged out from all devices successfully',
    });
  });

  it('should required JWT for logout-all-devices', async () => {
    const { body } = await request(app.getHttpServer())
      .post(
        apiEndpoint(ApiVersionEnum.V1, TOPICS.AUTH, ACTIONS.LOGOUT_ALL_DEVICES),
      )
      .expect(HttpStatus.UNAUTHORIZED);

    expect(body).toMatchObject({
      message: 'Unauthorized',
    });
  });
});
