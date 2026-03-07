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

describe('Material Module E2E', () => {
  let app: INestApplication;
  let commandBus: CommandBus;

  let tutorToken: string;
  let studentToken: string;
  let materialId: string;

  beforeAll(async () => {
    const setup = await setupE2EApp();
    app = setup.app;

    commandBus = app.get(CommandBus);

    // --- SEED TUTOR ---
    const tutor = await registerAndLogin(app, {
      email: 'tutor@neuralguru.com',
      password: 'tutor123',
      name: 'Sir Aiman',
    });

    await commandBus.execute(
      new UpdateUserRolesCommand(tutor.userId, [UserRole.TUTOR]),
    );

    const { body: tutorLogin } = await request(app.getHttpServer())
      .post(apiEndpoint(ApiVersionEnum.V1, TOPICS.AUTH, ACTIONS.LOGIN))
      .send({
        email: 'tutor@neuralguru.com',
        password: 'tutor123',
      })
      .expect(HttpStatus.CREATED);

    tutorToken = tutorLogin.accessToken;

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

  it('tutor can upload material', async () => {
    // POST /v1/material/upload with multipart + tutor token
    // NOTE: dto now requires 'topic' field

    const fileBuffer = Buffer.alloc(1024, 'test'); // 1KB fake file

    const { body } = await request(app.getHttpServer())
      .post(apiEndpoint(ApiVersionEnum.V1, TOPICS.MATERIAL, ACTIONS.UPLOAD))
      .auth(tutorToken, { type: 'bearer' })
      .field('title', 'Algebra Basics')
      .field('description', 'Introduction to algebra')
      .field('type', 'pdf')
      .field('subject', 'Mathematics')
      .field('topic', 'Algebra')
      .attach('file', fileBuffer, {
        filename: 'algebra-basics.pdf',
        contentType: 'application/pdf',
      })
      .expect(HttpStatus.CREATED);

    materialId = body.id;
  });

  it('student is forbidden from uploading', async () => {
    const fileBuffer = Buffer.alloc(512, 'test');

    const { body } = await request(app.getHttpServer())
      .post(apiEndpoint(ApiVersionEnum.V1, TOPICS.MATERIAL, ACTIONS.UPLOAD))
      .auth(studentToken, { type: 'bearer' })
      .field('title', 'Should not work')
      .field('type', 'pdf')
      .field('subject', 'TestSubject')
      .field('topic', 'TestTopic')
      .attach('file', fileBuffer, {
        filename: 'student_material.pdf',
        contentType: 'application/pdf',
      });

    expect(body).toHaveProperty(
      'message',
      'Access denied: you do not have permission to access this resource',
    );
    expect(body).toHaveProperty('error', 'Forbidden');
    expect(body).toHaveProperty('statusCode', HttpStatus.FORBIDDEN);
  });

  it('tutor can list all materials', async () => {
    const { body } = await request(app.getHttpServer())
      .get(apiEndpoint(ApiVersionEnum.V1, TOPICS.MATERIAL))
      .auth(tutorToken, { type: 'bearer' })
      .expect(HttpStatus.OK);

    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(1);

    const uploaded = body.find((m: any) => m.id === materialId);

    expect(uploaded).toBeDefined();
    expect(uploaded.title).toBe('Algebra Basics');
  });

  it('tutor can view single material', async () => {
    const { body } = await request(app.getHttpServer())
      .get(apiEndpoint(ApiVersionEnum.V1, TOPICS.MATERIAL, materialId))
      .auth(tutorToken, { type: 'bearer' })
      .expect(HttpStatus.OK);

    expect(body).toMatchObject({
      id: expect.any(String),
      title: 'Algebra Basics',
      description: 'Introduction to algebra',
      type: 'pdf',
      subject: 'Mathematics',
      topic: 'Algebra',
      fileUrl: expect.any(String),
      fileSize: 1024,
      mimeType: 'application/pdf',
      originalName: 'algebra-basics.pdf',
      uploadedBy: expect.any(String),
      assignedTo: [],
      assignedCount: 0,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });
});
