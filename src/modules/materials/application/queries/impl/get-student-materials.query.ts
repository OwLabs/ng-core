/**
 * GetStudentMaterialsQuery — for the student's "Learning Materials" page
 *
 * This query fetches ONLY materials assigned to a specific student.
 * The student ID comes from the JWT token (req.user.userId).
 *
 * WHY A SEPARATE QUERY INSTEAD OF A FILTER ON GetAllMaterials?
 *   1. Different authorization — students can ONLY see their materials
 *   2. Different response shape (maybe add "opened" status later)
 *   3. Different handler logic (no search/filter needed initially)
 *   4. Cleaner code — each query has one responsibility
 */
export class GetStudentMaterialsQuery {
  constructor(public readonly studentId: string) {}
}
