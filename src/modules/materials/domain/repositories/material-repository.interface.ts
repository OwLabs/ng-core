import { Material } from '../entities';
import { MaterialFilterOptions } from '../types';

/**
 * MATERIAL_REPOSITORY — DI token
 *
 * WHY A SYMBOL?
 *   TypeScript interfaces don't exist at runtime.
 *   NestJS DI needs a runtime token to match the provider.
 *   Symbol('IMaterialRepository') is a unique, collision-free token.
 *
 *   In materials.module.ts:
 *     { provide: MATERIAL_REPOSITORY, useClass: MaterialRepositoryImpl }
 *
 *   In handlers:
 *     @Inject(MATERIAL_REPOSITORY) private readonly repo: IMaterialRepository
 *
 * SAME PATTERN AS: USER_REPOSITORY, REFRESH_TOKEN_REPOSITORY
 */
export const MATERIAL_REPOSITORY = Symbol('IMaterialRepository');

/**
 * IMaterialRepository — the CONTRACT
 *
 * The domain says WHAT it needs. Infrastructure says HOW.
 *
 * WHY save() INSTEAD OF create() + update()?
 *   The repository doesn't care if it's new or existing.
 *   It just saves. Internally it can check if the document
 *   exists and decide to insert or update. This simplifies
 *   the domain code.
 */
export interface IMaterialRepository {
  save(material: Material): Promise<Material>;
  findById(id: string): Promise<Material | null>;
  findAll(options?: MaterialFilterOptions): Promise<Material[]>;
  findByStudentId(studentId: string): Promise<Material[]>;
  delete(id: string): Promise<void>;
}
