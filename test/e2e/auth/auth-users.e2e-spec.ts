import { HttpStatus, INestApplication } from '@nestjs/common';
import { AuthService } from 'src/modules/auth/services';
import { UsersService } from 'src/modules/users/services';
import { apiEndpoint, closeE2EApp, setupE2EApp } from '../setup.e2e';
import * as request from 'supertest';
import { ApiVersionEnum } from 'src/api';
import { ENDPOINT_SUBTOPICS, ENDPOINT_TOPICS } from '../constants';
import { RoleEnum } from 'src/common/decorators';
import { IUser } from 'src/core/domain/interfaces';

describe('Auth + Users E2E', () => {
  let app: INestApplication;
  let authService: AuthService;
  let usersService: UsersService;
  let spyRegister: jest.SpyInstance;
  let spyLogin: jest.SpyInstance;
  let spyLocalUserValidate: jest.SpyInstance;
  let spyUpdateRoles: jest.SpyInstance;

  let adminToken: string;
  let studentToken: string;

  beforeAll(async () => {
    const setup = await setupE2EApp();
    app = setup.app;

    authService = app.get(AuthService);
    usersService = app.get(UsersService);
  });

  beforeEach(async () => {
    spyRegister = jest.spyOn(authService, 'register');
    spyLogin = jest.spyOn(authService, 'login');
    spyLocalUserValidate = jest.spyOn(authService, 'validateUser');
    spyUpdateRoles = jest.spyOn(usersService, 'updateRoles');
  });

  afterEach(async () => {
    spyRegister.mockRestore();
    spyLogin.mockRestore();
    spyLocalUserValidate.mockRestore();
    spyUpdateRoles.mockRestore();
  });

  afterAll(async () => {
    await closeE2EApp();
  });

  it('should execute full flow: register → login → RBAC → profile', async () => {
    const { body: adminObj } = await request(app.getHttpServer())
      .post(
        apiEndpoint(
          ApiVersionEnum.V1,
          ENDPOINT_TOPICS.AUTH,
          ENDPOINT_SUBTOPICS.REGISTER,
        ),
      )
      .send({
        email: 'aiman@admin.com',
        name: 'aiman adli',
        password: 'password123',
      })
      .expect(201);

    expect(adminObj).toMatchObject({
      _id: expect.any(String),
      email: 'aiman@admin.com',
      name: 'aiman adli',
      provider: 'local',
      roles: ['user'],
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const userAdmin: IUser = adminObj;

    await usersService.updateRoles(String(userAdmin._id), [RoleEnum.ADMIN]);

    const { body: studentObj } = await request(app.getHttpServer())
      .post(
        apiEndpoint(
          ApiVersionEnum.V1,
          ENDPOINT_TOPICS.AUTH,
          ENDPOINT_SUBTOPICS.REGISTER,
        ),
      )
      .send({
        email: 'ashley@student.com',
        name: 'ashley',
        password: 'pass1997',
      })
      .expect(201);

    expect(studentObj).toMatchObject({
      _id: expect.any(String),
      email: 'ashley@student.com',
      name: 'ashley',
      provider: 'local',
      roles: ['user'],
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const userStudent: IUser = studentObj;

    await usersService.updateRoles(String(userStudent._id), [RoleEnum.STUDENT]);

    expect(spyRegister).toHaveBeenCalledTimes(2);
    expect(spyUpdateRoles).toHaveBeenCalledTimes(2);

    const { body: loginAdmin } = await request(app.getHttpServer())
      .post(
        apiEndpoint(
          ApiVersionEnum.V1,
          ENDPOINT_TOPICS.AUTH,
          ENDPOINT_SUBTOPICS.LOGIN,
        ),
      )
      .send({ email: 'aiman@admin.com', password: 'password123' })
      .expect(201);

    adminToken = loginAdmin.access_token;

    const { body: loginStudent } = await request(app.getHttpServer())
      .post(
        apiEndpoint(
          ApiVersionEnum.V1,
          ENDPOINT_TOPICS.AUTH,
          ENDPOINT_SUBTOPICS.LOGIN,
        ),
      )
      .send({ email: 'ashley@student.com', password: 'pass1997' })
      .expect(201);

    studentToken = loginStudent.access_token;

    expect(spyLogin).toHaveBeenCalledTimes(2);
    expect(spyLocalUserValidate).toHaveBeenCalledTimes(2);

    const { body: adminListUsers } = await request(app.getHttpServer())
      .get(apiEndpoint(ApiVersionEnum.V1, ENDPOINT_TOPICS.USER))
      .auth(adminToken, { type: 'bearer' })
      .expect(HttpStatus.OK);

    const { body: studentListUsers } = await request(app.getHttpServer())
      .get(apiEndpoint(ApiVersionEnum.V1, ENDPOINT_TOPICS.USER))
      .auth(studentToken, { type: 'bearer' })
      .expect(HttpStatus.FORBIDDEN);

    const { body: profile } = await request(app.getHttpServer())
      .get(
        apiEndpoint(
          ApiVersionEnum.V1,
          ENDPOINT_TOPICS.USER,
          ENDPOINT_SUBTOPICS.PROFILE,
        ),
      )
      .auth(studentToken, { type: 'bearer' })
      .expect(HttpStatus.OK);

    expect(profile.email).toBe('ashley@student.com');
  });
});
