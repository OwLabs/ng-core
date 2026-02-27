/**
 * GetMaterialByIdQuery — for the "View" modal
 *
 * SAME PATTERN AS: GetUserByIdQuery in users/application/queries/
 */
export class GetMaterialByIdQuery {
  constructor(public readonly materialId: string) {}
}
