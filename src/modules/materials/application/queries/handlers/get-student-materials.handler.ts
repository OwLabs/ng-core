import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetStudentMaterialsQuery } from '../impl';
import { Inject } from '@nestjs/common';
import {
  IMaterialRepository,
  MATERIAL_REPOSITORY,
} from 'src/modules/materials/domain/repositories';
import { MaterialResponse } from 'src/modules/materials/domain/types';

/**
 * GetStudentMaterialsHandler — fetches materials assigned to a student
 *
 * HOW IT WORKS:
 *   The repository queries MongoDB for documents where the
 *   assignedTo array CONTAINS the student's ObjectId.
 *
 *   MongoDB: { assignedTo: { $in: [studentObjectId] } }
 *   This is efficient because MongoDB can use an index on the array.
 */
@QueryHandler(GetStudentMaterialsQuery)
export class GetStudentMaterialsHandler
  implements IQueryHandler<GetStudentMaterialsQuery>
{
  constructor(
    @Inject(MATERIAL_REPOSITORY)
    private readonly materialRepository: IMaterialRepository,
  ) {}

  async execute(query: GetStudentMaterialsQuery): Promise<MaterialResponse[]> {
    const materials = await this.materialRepository.findByStudentId(
      query.studentId,
    );

    return materials.map((material) => material.toResponse());
  }
}
