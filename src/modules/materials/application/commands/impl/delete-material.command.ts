/**
 * DeleteMaterialCommand
 *
 * Simple command — just needs the material ID.
 * The handler will:
 *   1. Find the material (to get the file path)
 *   2. Delete from database
 *   3. Delete file from disk (cleanup)
 */
export class DeleteMaterialCommand {
  constructor(public readonly materialId: string) {}
}
