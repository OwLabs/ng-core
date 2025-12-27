import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { closeE2EApp, setupE2EApp } from '../setup.e2e';

/**
 * SKIP FOR NOW
 */
describe.skip('Google OAuth E2E (Isolated)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const setup = await setupE2EApp();
    app = setup.app;
  });

  afterAll(async () => {
    await closeE2EApp();
  });

  it('should authenticate using MockGoogleStrategy', async () => {
    const res = await request(app.getHttpServer()).get(`/auth/google/redirect`);

    console.log('first:', res.body);
  });
});
