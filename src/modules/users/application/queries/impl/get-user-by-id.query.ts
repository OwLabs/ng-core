/**
 * Query to find a user by their ID.
 *
 * WHY A CLASS? NestJS CQRS uses the class name to route
 * queries to the correct handler via @QueryHandler(GetUserByIdQuery)
 *
 * FLOW: Controller creates this → QueryBus.execute() → GetUserByIdHandler
 *
 * This class has NO logic. It's just a data carrier (a message)
 */
export class GetUserByIdQuery {
  constructor(public readonly userId: string) {}
}
