import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteMaterialCommand } from '../impl';
import { Inject, NotFoundException } from '@nestjs/common';
import {
  IMaterialRepository,
  MATERIAL_REPOSITORY,
} from 'src/modules/materials/domain/repositories';
import * as fs from 'fs';
import * as path from 'path';

/**
 * DeleteMaterialHandler
 *
 * Deletes a material from:
 *   1. Database (via repository)
 *   2. File system (cleanup the uploaded file)
 *
 * WHY DELETE THE FILE?
 *   If you only delete the DB record, the file stays on disk forever.
 *   This is a "resource leak." The handler handles the full cleanup.
 *
 * NOTE: File deletion uses try/catch because the file might
 * already be gone (manual deletion, disk failure, etc.)
 * We don't want DB deletion to fail because of a missing file.
 */
@CommandHandler(DeleteMaterialCommand)
export class DeleteMaterialHandler
  implements ICommandHandler<DeleteMaterialCommand>
{
  constructor(
    @Inject(MATERIAL_REPOSITORY)
    private readonly materialRepository: IMaterialRepository,
  ) {}

  async execute(command: DeleteMaterialCommand): Promise<void> {
    // 1. Find the material (need file path for cleanup)
    const material = await this.materialRepository.findById(command.materialId);

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    // 2. Delete from database
    await this.materialRepository.delete(command.materialId);

    // 3. Clean up file from disk
    if (material.fileUrl) {
      const filePath = path.join(process.cwd(), material.fileUrl);

      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        // No need to throw error
        // Not a critical error though
        console.log('error deleting file:', error);
      }
    }
  }
}
