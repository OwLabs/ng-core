import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { MaterialEntity } from 'src/core/domain/entities';
import { MaterialRepository } from 'src/core/infrastructure/repositories';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class MaterialService {
  constructor(private readonly materialRepo: MaterialRepository) {}

  async uploadMaterial(payload: {
    title: string;
    description: string;
    type: 'document' | 'video';
    subject: string;
    fileUrl?: string;
    fileSize?: number;
    mimeType?: string;
    originalName?: string;
    uploadedBy: string;
    courseId?: string;
  }): Promise<MaterialEntity> {
    return this.materialRepo.create({
      ...payload,
      uploadedBy: new Types.ObjectId(payload.uploadedBy),
    });
  }

  async getAllMaterials(): Promise<MaterialEntity[]> {
    return this.materialRepo.findAll();
  }

  async getMaterialById(materialId: string): Promise<MaterialEntity> {
    const material = await this.materialRepo.findById(materialId);

    if (!material) {
      throw new NotFoundException(`Material not found`);
    }

    return material;
  }

  async downloadMaterial(
    materialId: string,
  ): Promise<{ path: string; filename: string }> {
    const material = await this.getMaterialById(materialId);

    if (!material.fileUrl) {
      throw new NotFoundException(`File location not found for this material`);
    }

    const filePath = path.join(process.cwd(), material.fileUrl);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File does not exist on server');
    }

    return {
      path: filePath,
      filename: material.originalName ?? path.basename(filePath),
    };
  }
}
