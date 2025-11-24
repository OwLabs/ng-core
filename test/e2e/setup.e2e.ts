import { INestApplication, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as request from 'supertest';
import mongoose from 'mongoose';
import { AppModule } from '../../src/app.module';
import { ApiVersionEnum } from 'src/api';

let app: INestApplication;
let mongod: MongoMemoryServer;

export const setupE2EApp = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  process.env.MONGO_URI = uri;
  process.env.JWT_SECRET = 'test_secret_example';
  process.env.JWT_EXPIRES_IN = '5000';

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: '',
    defaultVersion: ApiVersionEnum.V1,
  });

  await app.init();

  return { app, request: request(app.getHttpServer()) };
};

export const apiEndpoint = (
  apiVer: ApiVersionEnum,
  path?: string,
  path2?: string,
): string => {
  return `/${apiVer}${path ? `/${path}` : ''}${path2 ? `/${path2}` : ''}`;
};

export const closeE2EApp = async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
  if (app) await app.close();
};
