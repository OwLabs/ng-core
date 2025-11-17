import { INestApplication } from '@nestjs/common';
import { apiEndpoint, closeE2EApp, setupE2EApp } from '../setup.e2e';
import * as request from 'supertest';
import { AuthService } from 'src/modules/auth/services';
import { ENDPOINT_SUBTOPICS, ENDPOINT_TOPICS } from '../constants';
import { ApiVersionEnum } from 'src/api';

describe('UserModule (E2E)', () => {
  let app: INestApplication;
  let token: string;
  let authService: AuthService;

  beforeAll(async () => {
    const setup = await setupE2EApp();
    app = setup.app;

    await request(app.getHttpServer())
      .post(
        apiEndpoint(
          ApiVersionEnum.V1,
          ENDPOINT_TOPICS.AUTH,
          ENDPOINT_SUBTOPICS.REGISTER,
        ),
      )
      .send({
        email: 'aiman@example.com',
        password: 'aiman123',
        name: 'Aiman',
      });

    const { body: loginRes } = await request(app.getHttpServer())
      .post(
        apiEndpoint(
          ApiVersionEnum.V1,
          ENDPOINT_TOPICS.AUTH,
          ENDPOINT_SUBTOPICS.LOGIN,
        ),
      )
      .send({
        email: 'aiman@example.com',
        password: 'aiman123',
      });

    token = loginRes.access_token;
  });

  beforeEach(async () => {
    authService = app.get(AuthService);
  });

  afterAll(async () => {
    await closeE2EApp();
  });

  it('should get user profile when authenticated', async () => {});
});
