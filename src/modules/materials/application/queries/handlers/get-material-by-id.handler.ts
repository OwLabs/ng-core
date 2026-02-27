import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetMaterialByIdQuery } from '../impl';
import { Inject, NotFoundException } from '@nestjs/common';
import {
  IMaterialRepository,
  MATERIAL_REPOSITORY,
} from 'src/modules/materials/domain/repositories';
import { MaterialResponse } from 'src/modules/materials/domain/types';

/**
 * SAME PATTERN AS: GetUserByIdHandler in users/application/queries/
 */
@QueryHandler(GetMaterialByIdQuery)
export class GetMaterialByIdHandler
  implements IQueryHandler<GetMaterialByIdQuery>
{
  constructor(
    @Inject(MATERIAL_REPOSITORY)
    private readonly materialRepository: IMaterialRepository,
  ) {}

  async execute(query: GetMaterialByIdQuery): Promise<MaterialResponse> {
    const material = await this.materialRepository.findById(query.materialId);

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    return material.toResponse();
  }
}
