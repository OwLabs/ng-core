import { INestApplication, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import mongoose from 'mongoose';
import { AppModule } from 'src/app.module';
import { ApiVersionEnum } from 'src/common/config';

let app: INestApplication;

export async function setupE2EApp(): Promise<{ app: INestApplication }> {
  // MONGO_URI was set by globalSetup - we dont create a new server alright
  process.env.JWT_SECRET = 'test_secret_e2e';
  process.env.JWT_EXPIRES_IN = '5000';

  const moduleFixtture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixtture.createNestApplication();

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: '',
    defaultVersion: ApiVersionEnum.V1,
  });

  await app.init();

  return { app };
}

export async function closeE2EApp(): Promise<void> {
  if (app) {
    await app.close();
  }

  await mongoose.disconnect();
}

/**
 * Build a versioned API endpoint path.
 *
 * WHY THIS HELPER?
 *   Your controllers use @Controller({ path: 'auth', version: ApiVersionEnum.V1 })
 *   which makes the actual URL: /v1/auth/login
 *   Rather than hardcoding '/v1/auth/login' in every test,
 *   this builds it consistently.
 */

export function apiEndpoint(
  version: ApiVersionEnum,
  ...segments: string[]
): string {
  const path = segments.filter(Boolean).join('/');

  return `/${version}${path ? `/${path}` : ''}`;
}
