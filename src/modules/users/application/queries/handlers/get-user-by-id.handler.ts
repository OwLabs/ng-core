import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserByIdQuery } from '../impl';
import { Inject, NotFoundException } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from 'src/modules/users/domain/repositories';
import { User } from 'src/modules/users/domain/entities';

/**
 * Handler for GetUserByIdQuery.
 *
 * === HOW CQRS HANDLERS WORK ===
 *
 * @QueryHandler(GetUserByIdQuery)
 *   Tells NestJS: "When someone executes a GetUserByIdQuery, call ME."
 *
 * implements IQueryHandler<GetUserByIdQuery>
 *   Tells TypeScript: "I MUST have an execute(query) method."
 *   If you forget it, TypeScript gives an error. This is OOP's
 *   "implements" keyword — enforcing a contract.
 *
 * @Inject(USER_REPOSITORY)
 *   Tells NestJS DI: "Give me whatever is registered for this token."
 *   In users.module.ts we registered:
 *     { provide: USER_REPOSITORY, useClass: UserRepositoryImpl }
 *   So NestJS creates UserRepositoryImpl and injects it here.
 *   But this handler only knows the INTERFACE (IUserRepository).
 *   That's Dependency Inversion — depend on abstraction, not concrete.
 */
@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async execute(query: GetUserByIdQuery): Promise<User> {
    const user = await this.userRepository.findById(query.userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
