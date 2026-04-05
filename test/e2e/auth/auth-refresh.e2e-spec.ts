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
import { UserRole } from 'src/modules/users/domain/enums';
import { AUTH_COOKIE_NAMES } from 'src/modules/auth/domain/constants';
import { parseCookieValue } from '../_support/utils';

describe('Auth Refresh Tokens E2E', () => {
  let app: INestApplication;
  let data: RegisterAndLoginResult;

  beforeAll(async () => {
    const setup = await setupE2EApp();
    app = setup.app;

    data = await registerAndLogin(
      app,
      {
        email: 'syafiq_feroz@gmail.com',
        name: 'Syafiq Feroz',
        password: 'password123',
      },
      UserRole.STUDENT,
    );
  });

  afterAll(async () => {
    await closeE2EApp();
  });

  it('should rotate refresh token and get new tokens', async () => {
    const res = await request(app.getHttpServer())
      .post(apiEndpoint(ApiVersionEnum.V1, TOPICS.AUTH, ACTIONS.REFRESH))
      .set('Cookie', [
        `${AUTH_COOKIE_NAMES.REFRESH_TOKEN}=${data.refreshToken}`,
      ])
      .expect(HttpStatus.CREATED);

    expect(res.body.data).toMatchObject({
      message: 'Token refreshed successfully',
    });

    const cookies = res.headers['set-cookie'] as unknown as string[];
    const newRefreshToken = parseCookieValue(
      cookies,
      AUTH_COOKIE_NAMES.REFRESH_TOKEN,
    );

    expect(newRefreshToken).toBeDefined();
    expect(newRefreshToken).not.toBe(data.refreshToken);

    data.refreshToken = newRefreshToken!;
  });

  it('should logout successfully', async () => {
    const { body } = await request(app.getHttpServer())
      .post(apiEndpoint(ApiVersionEnum.V1, TOPICS.AUTH, ACTIONS.LOGOUT))
      .set('Cookie', [
        `${AUTH_COOKIE_NAMES.REFRESH_TOKEN}=${data.refreshToken}`,
      ])
      .expect(HttpStatus.NO_CONTENT);

    expect(body.data).toBeUndefined();
  });

  it('should logout all devices successfully with existing JWT tokens', async () => {
    const { body } = await request(app.getHttpServer())
      .post(
        apiEndpoint(ApiVersionEnum.V1, TOPICS.AUTH, ACTIONS.LOGOUT_ALL_DEVICES),
      )
      .auth(data.accessToken, { type: 'bearer' })
      .expect(HttpStatus.OK);

    expect(body.data).toMatchObject({
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
