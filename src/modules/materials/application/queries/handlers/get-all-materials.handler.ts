import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAllMaterialsQuery } from '../impl';
import { Inject } from '@nestjs/common';
import {
  IMaterialRepository,
  MATERIAL_REPOSITORY,
} from 'src/modules/materials/domain/repositories';
import { MaterialResponse } from 'src/modules/materials/domain/types';

/**
 * GetAllMaterialsHandler — tutor's material listing with search + filter
 *
 * NOTICE: The handler passes the filter options to the repository.
 * The repository decides HOW to filter (MongoDB $regex, text index, etc.)
 * The handler doesn't care about the database implementation.
 *
 * SAME PATTERN AS: GetAllUsersHandler in users/application/queries/
 */
@QueryHandler(GetAllMaterialsQuery)
export class GetAllMaterialsHandler
  implements IQueryHandler<GetAllMaterialsQuery>
{
  constructor(
    @Inject(MATERIAL_REPOSITORY)
    private readonly materialRepository: IMaterialRepository,
  ) {}

  async execute(query: GetAllMaterialsQuery): Promise<MaterialResponse[]> {
    const materials = await this.materialRepository.findAll({
      search: query.search,
      subject: query.subject,
    });

    return materials.map((material) => material.toResponse());
  }
}
