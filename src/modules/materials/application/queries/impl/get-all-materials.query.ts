/**
 * GetAllMaterialsQuery — for the tutor's material listing page
 *
 * WHAT IS A QUERY?
 *   A query is a READ request. It never modifies data.
 *   It carries filter parameters the handler uses to fetch data.
 *
 * WHY SEPARATE FROM COMMANDS?
 *   Commands change state (INSERT, UPDATE, DELETE).
 *   Queries read state (SELECT).
 *   Keeping them separate lets you optimize each path independently.
 *
 *   Example: Queries can use .lean() for performance (no Mongoose overhead).
 *   Commands need full Mongoose documents for validation hooks.
 *
 * FRONTEND USAGE:
 *   GET /material                          → new GetAllMaterialsQuery()
 *   GET /material?search=algebra           → new GetAllMaterialsQuery('algebra')
 *   GET /material?subject=Trigonometry     → new GetAllMaterialsQuery(undefined, 'Trigonometry')
 *   GET /material?search=basics&subject=Math → new GetAllMaterialsQuery('basics', 'Math')
 */
export class GetAllMaterialsQuery {
  constructor(
    public readonly search?: string,
    public readonly subject?: string,
  ) {}
}
