import { HttpStatus, INestApplication } from '@nestjs/common';
import { apiEndpoint, closeE2EApp, setupE2EApp } from '../setup.e2e';
import { MaterialService } from 'src/modules/materials/services';
import * as request from 'supertest';
import { ApiVersionEnum } from 'src/api';
import { ENDPOINT_SUBTOPICS, ENDPOINT_TOPICS } from '../constants';
import { UserRepository } from 'src/core/infrastructure/repositories';
import { seedUser } from '../helpers';
import { RoleEnum } from 'src/common/decorators';

describe('MaterialController', () => {
  let app: INestApplication;

  // Declare service variable
  let materialService: MaterialService;
  let userRepo: UserRepository;

  // Declare service method variable
  let spyUploadMaterial: jest.SpyInstance;
  let spyGetMaterials: jest.SpyInstance;
  let spyViewSingleMaterial: jest.SpyInstance;
  let spyDownloadMaterial: jest.SpyInstance;

  let adminAccessToken: string;
  let studentAccessToken: string;
  let materialId: string;
  let fileBuffer: Buffer;

  beforeAll(async () => {
    const setup = await setupE2EApp();
    app = setup.app;

    materialService = app.get(MaterialService);
    userRepo = app.get(UserRepository);

    await seedUser(userRepo, {
      email: 'sir.azlan@owlabs.com',
      name: 'Sir Azlan',
      password: 'azlantutor123',
      roles: [RoleEnum.TUTOR],
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
        email: 'sir.azlan@owlabs.com',
        password: 'azlantutor123',
      });

    adminAccessToken = loginRes.access_token;

    fileBuffer = Buffer.alloc(4 * 1024 * 1024, 'a'); // fake 4 mb file
  });

  beforeEach(async () => {
    spyUploadMaterial = jest.spyOn(materialService, 'uploadMaterial');
    spyGetMaterials = jest.spyOn(materialService, 'getAllMaterials');
    spyViewSingleMaterial = jest.spyOn(materialService, 'getMaterialById');
    spyDownloadMaterial = jest.spyOn(materialService, 'downloadMaterial');
  });

  afterEach(async () => {
    // clear material service
    spyUploadMaterial.mockRestore();
    spyGetMaterials.mockRestore();
    spyViewSingleMaterial.mockRestore();
    spyDownloadMaterial.mockRestore();
  });

  afterAll(async () => {
    await closeE2EApp();
  });

  it('should upload material', async () => {
    const { body: uploadRes } = await request(app.getHttpServer())
      .post(
        apiEndpoint(
          ApiVersionEnum.V1,
          ENDPOINT_TOPICS.MATERIAL,
          ENDPOINT_SUBTOPICS.UPLOAD,
        ),
      )
      .auth(adminAccessToken, { type: 'bearer' })
      .field('title', 'OwLabs SOP')
      .field('description', 'To guide tutor')
      .field('type', 'document')
      .field('subject', 'Guideline')
      .attach('file', fileBuffer, {
        filename: 'owlabs-sop.pdf',
        contentType: 'application/pdf',
      })
      .expect(HttpStatus.CREATED);

    expect(spyUploadMaterial).toHaveBeenCalledTimes(1);

    materialId = uploadRes._id;
  });

  it('should get all materials', async () => {
    const res = await request(app.getHttpServer())
      .get(apiEndpoint(ApiVersionEnum.V1, ENDPOINT_TOPICS.MATERIAL))
      .auth(adminAccessToken, { type: 'bearer' })
      .expect(HttpStatus.OK);

    expect(spyGetMaterials).toHaveBeenCalledTimes(1);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should view a single material', async () => {
    const res = await request(app.getHttpServer())
      .get(apiEndpoint(ApiVersionEnum.V1, ENDPOINT_TOPICS.MATERIAL, materialId))
      .auth(adminAccessToken, { type: 'bearer' })
      .expect(HttpStatus.OK);

    expect(spyViewSingleMaterial).toHaveBeenCalledTimes(1);
    expect(res.body).toMatchObject({
      _id: materialId,
      title: 'OwLabs SOP',
      description: 'To guide tutor',
      type: 'document',
      subject: 'Guideline',
      fileUrl: expect.any(String),
      fileSize: 4194304,
      mimeType: 'application/pdf',
      uploadedBy: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('should download material file', async () => {
    const urlPath = apiEndpoint(
      ApiVersionEnum.V1,
      ENDPOINT_TOPICS.MATERIAL,
      ENDPOINT_SUBTOPICS.DOWNLOAD,
    );

    const res = await request(app.getHttpServer())
      .get(`${urlPath}/${materialId}`)
      .auth(adminAccessToken, { type: 'bearer' })
      .expect(HttpStatus.OK);

    expect(spyDownloadMaterial).toHaveBeenCalledTimes(1);
    expect(res.headers['content-type']).toBe('application/octet-stream');
    expect(res.headers['content-disposition']).toBe(
      'attachment; filename="owlabs-sop.pdf"',
    );
  });

  describe('Forbid access', () => {
    it('should forbid upload for non-tutor role', async () => {
      await seedUser(userRepo, {
        email: 'student@owlabs.com',
        name: 'AimanAshley',
        password: 'student123',
        roles: [RoleEnum.STUDENT],
      });

      const resLogin = await request(app.getHttpServer())
        .post(
          apiEndpoint(
            ApiVersionEnum.V1,
            ENDPOINT_TOPICS.AUTH,
            ENDPOINT_SUBTOPICS.LOGIN,
          ),
        )
        .send({
          email: 'student@owlabs.com',
          password: 'student123',
        });

      studentAccessToken = resLogin.body.access_token;

      const { body: studentUploadRes } = await request(app.getHttpServer())
        .post(
          apiEndpoint(
            ApiVersionEnum.V1,
            ENDPOINT_TOPICS.MATERIAL,
            ENDPOINT_SUBTOPICS.UPLOAD,
          ),
        )
        .auth(studentAccessToken, { type: 'bearer' })
        .field('title', 'Mathematic')
        .field('description', 'Mathematic 101')
        .field('type', 'document')
        .field('subject', 'Notebook')
        .attach('file', fileBuffer, {
          filename: 'mathematic-101.pdf',
          contentType: 'application/pdf',
        })
        .expect(HttpStatus.FORBIDDEN);

      expect(spyUploadMaterial).not.toHaveBeenCalled();

      expect(studentUploadRes).toMatchObject({
        message:
          'Access denied: you do not have permission to access this resource',
        error: 'Forbidden',
        statusCode: HttpStatus.FORBIDDEN,
      });
    });
  });
});
