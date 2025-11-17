import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { apiEndpoint, closeE2EApp, setupE2EApp } from './e2e';
import { ApiVersionEnum } from 'src/api';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const setup = await setupE2EApp();
    app = setup.app;
  });

  afterAll(async () => {
    await closeE2EApp();
  });

  it('/ (GET)', async () => {
    return await request(app.getHttpServer())
      .get(apiEndpoint(ApiVersionEnum.V1))
      .expect(200)
      .expect('Hello World!');
  });
});
