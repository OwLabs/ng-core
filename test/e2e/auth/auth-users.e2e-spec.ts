import { HttpStatus, INestApplication } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  apiEndpoint,
  closeE2EApp,
  setupE2EApp,
} from '../_support/setup/e2e-app.helper';
import { registerAndLogin } from '../_support/helpers';
import { UpdateUserRolesCommand } from 'src/modules/users/application/commands/impl';
import { UserRole } from 'src/modules/users/domain/enums';
import request from 'supertest';
import { ApiVersionEnum } from 'src/common/config';
import { ACTIONS, TOPICS } from '../_support/constants';

describe('Auth + User Roles E2E', () => {
  let app: INestApplication;
  let commandBus: CommandBus;

  let adminToken: string;
  let studentToken: string;

  beforeAll(async () => {
    const setup = await setupE2EApp();
    app = setup.app;

    commandBus = app.get(CommandBus);

    // --- SEED ADMIN ---
    const admin = await registerAndLogin(app, {
      email: 'admin@owlabs.com',
      password: 'admin123',
      name: 'Admin',
    });

    await commandBus.execute(
      new UpdateUserRolesCommand(admin.userId, [UserRole.ADMIN]),
    );

    const { body: adminLogin } = await request(app.getHttpServer())
      .post(apiEndpoint(ApiVersionEnum.V1, TOPICS.AUTH, ACTIONS.LOGIN))
      .send({
        email: 'admin@owlabs.com',
        password: 'admin123',
      })
      .expect(HttpStatus.CREATED);

    adminToken = adminLogin.accessToken;

    // --- SEED USER ---
    const user = await registerAndLogin(app, {
      email: 'matnor@yahoo.com',
      password: 'user123',
      name: 'Matnor',
    });

    await commandBus.execute(
      new UpdateUserRolesCommand(user.userId, [UserRole.STUDENT]),
    );

    const { body: studentLogin } = await request(app.getHttpServer())
      .post(apiEndpoint(ApiVersionEnum.V1, TOPICS.AUTH, ACTIONS.LOGIN))
      .send({
        email: 'matnor@yahoo.com',
        password: 'user123',
      })
      .expect(HttpStatus.CREATED);

    studentToken = studentLogin.accessToken;
  });

  afterAll(async () => {
    await closeE2EApp();
  });

  it('admin can list all users', async () => {
    const { body } = await request(app.getHttpServer())
      .get(apiEndpoint(ApiVersionEnum.V1, TOPICS.USERS))
      .auth(adminToken, { type: 'bearer' })
      .expect(HttpStatus.OK);

    expect(body).toMatchObject([
      {
        id: expect.any(String),
        email: 'admin@owlabs.com',
        name: 'Admin',
        provider: 'local',
        providerId: null,
        avatar: null,
        roles: ['admin'],
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
      {
        id: expect.any(String),
        email: 'matnor@yahoo.com',
        name: 'Matnor',
        provider: 'local',
        providerId: null,
        avatar: null,
        roles: ['student'],
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    ]);
  });

  it('student cannot list all users', async () => {
    const { body } = await request(app.getHttpServer())
      .get(apiEndpoint(ApiVersionEnum.V1, TOPICS.USERS))
      .auth(studentToken, { type: 'bearer' })
      .expect(HttpStatus.FORBIDDEN);

    expect(body).toHaveProperty(
      'message',
      'Access denied: you do not have permission to access this resource',
    );
    expect(body).toHaveProperty('error', 'Forbidden');
  });

  it('student can view own profile', async () => {
    const { body } = await request(app.getHttpServer())
      .get(apiEndpoint(ApiVersionEnum.V1, TOPICS.USERS, ACTIONS.PROFILE))
      .auth(studentToken, { type: 'bearer' })
      .expect(HttpStatus.OK);

    expect(body).toMatchObject({
      id: expect.any(String),
      email: 'matnor@yahoo.com',
      name: 'Matnor',
      provider: 'local',
      roles: [UserRole.STUDENT],
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('unauthenticated request returns 401', async () => {
    await request(app.getHttpServer())
      .get(apiEndpoint(ApiVersionEnum.V1, TOPICS.USERS, ACTIONS.PROFILE))
      .expect(HttpStatus.UNAUTHORIZED);
  });
});
