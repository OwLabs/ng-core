import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { apiEndpoint } from '../setup/e2e-app.helper';
import { ApiVersionEnum } from 'src/common/config';
import { ACTIONS, TOPICS } from '../constants';

export interface RegisterAndLoginResult {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

export async function registerAndLogin(
  app: INestApplication,
  user: { email: string; name: string; password: string },
): Promise<RegisterAndLoginResult> {
  // 1. Register
  const { body: registered } = await request(app.getHttpServer())
    .post(apiEndpoint(ApiVersionEnum.V1, TOPICS.AUTH, ACTIONS.REGISTER))
    .send(user)
    .expect(201);

  // 2. Login
  const { body: loginRes } = await request(app.getHttpServer())
    .post(apiEndpoint(ApiVersionEnum.V1, TOPICS.AUTH, ACTIONS.LOGIN))
    .send({ email: user.email, password: user.password })
    .set('User-Agent', 'e2e-test-agent/1.0')
    .expect(201);

  return {
    accessToken: loginRes.accessToken,
    refreshToken: loginRes.refreshToken,
    userId: registered.id,
  };
}
