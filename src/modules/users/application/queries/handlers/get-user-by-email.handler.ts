import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserByEmailQuery } from '../impl';
import { Inject } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from 'src/modules/users/domain/repositories';
import { User } from 'src/modules/users/domain/entities';

/**
 * Handler for GetUserByEmailQuery.
 *
 * NOTICE: Returns null instead of throwing NotFoundException
 * WHY? Auth module needs to check "does this email exist?"
 * If we threw an error, auth would need try/catch for a NORMAL flow
 * Returning null is the correct way to say "not found, and that's OK."
 */
@QueryHandler(GetUserByEmailQuery)
export class GetUserByEmailHandler
  implements IQueryHandler<GetUserByEmailQuery>
{
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async execute(query: GetUserByEmailQuery): Promise<User | null> {
    return this.userRepository.findByEmail(query.email);
  }
}
