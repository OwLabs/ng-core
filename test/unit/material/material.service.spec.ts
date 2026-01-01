import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { MaterialEntity } from 'src/core/domain/entities';
import { MaterialRepository } from 'src/core/infrastructure/repositories';
import { MaterialService } from 'src/modules/materials/services';

describe('MaterialService', () => {
  let materialService: MaterialService;
  let materialRepo: jest.Mocked<MaterialRepository>;

  const mockMaterial = new MaterialEntity({
    _id: new Types.ObjectId(),
    title: 'Material Test',
    description: 'material only',
    type: 'document',
    subject: 'Guideline Beginner',
    fileUrl: '/uploads/test.pdf',
    uploadedBy: new Types.ObjectId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);

  const mockMaterialFunc = () =>
    new MaterialEntity({
      _id: new Types.ObjectId(),
      title: 'Material Function Test',
      description: 'for material service testing function only',
      type: 'document',
      subject: 'Guideline Function',
      fileUrl: '/uploads/test.pdf',
      uploadedBy: new Types.ObjectId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterialService,
        {
          provide: MaterialRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    materialService = module.get(MaterialService);
    materialRepo = module.get(MaterialRepository);
  });

  describe('uploadMaterial', () => {
    it('should create a new material (partial payload)', async () => {
      materialRepo.create.mockResolvedValue(mockMaterialFunc());

      const result = await materialService.uploadMaterial({
        title: 'Material Function Test',
        description: 'for material service testing function only',
        type: 'document',
        subject: 'Guideline Function',
        fileUrl: '/uploads/test.pdf',
        uploadedBy: new Types.ObjectId().toString(),
      });

      expect(materialRepo.create).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(MaterialEntity);
      expect(result).toMatchObject({
        _id: expect.any(Types.ObjectId),
        title: 'Material Function Test',
        description: 'for material service testing function only',
        type: 'document',
        subject: 'Guideline Function',
        fileUrl: '/uploads/test.pdf',
        uploadedBy: expect.any(Types.ObjectId),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });

  describe('getAllMaterials', () => {
    it('should return all materials', async () => {
      materialRepo.findAll.mockResolvedValue([
        mockMaterialFunc(),
        mockMaterialFunc(),
      ]);

      const result = await materialService.getAllMaterials();

      expect(materialRepo.findAll).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(MaterialEntity);
      expect(result).toMatchObject([
        {
          _id: expect.any(Types.ObjectId),
          title: 'Material Function Test',
          description: 'for material service testing function only',
          type: 'document',
          subject: 'Guideline Function',
          fileUrl: '/uploads/test.pdf',
          uploadedBy: expect.any(Types.ObjectId),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        {
          _id: expect.any(Types.ObjectId),
          title: 'Material Function Test',
          description: 'for material service testing function only',
          type: 'document',
          subject: 'Guideline Function',
          fileUrl: '/uploads/test.pdf',
          uploadedBy: expect.any(Types.ObjectId),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      ]);
    });
  });

  describe('getMaterialById', () => {
    it('should return a single material', async () => {
      materialRepo.findById.mockResolvedValue(mockMaterial);

      const result = await materialService.getMaterialById(
        mockMaterial._id.toString(),
      );

      expect(materialRepo.findById).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(MaterialEntity);
      expect(result).toMatchObject({
        _id: expect.any(Types.ObjectId),
        title: 'Material Test',
        description: 'material only',
        type: 'document',
        subject: 'Guideline Beginner',
        fileUrl: '/uploads/test.pdf',
        uploadedBy: expect.any(Types.ObjectId),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });

  describe('downloadMaterial', () => {
    it('should download a single material', async () => {
      jest.spyOn(require('fs'), 'existsSync').mockReturnValue(true);

      materialRepo.findById.mockResolvedValue(mockMaterial);

      const result = await materialService.downloadMaterial(
        mockMaterial._id.toString(),
      );

      expect(jest.spyOn(require('fs'), 'existsSync')).toHaveBeenCalledTimes(1);
      expect(materialRepo.findById).toHaveBeenCalledTimes(1);

      expect(result.path).toContain('uploads');
      expect(result.filename).toBe('test.pdf');

      expect(result).toMatchObject({
        path: expect.any(String),
        filename: expect.any(String),
      });
    });
  });
});
