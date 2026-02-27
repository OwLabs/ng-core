import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserProfileQuery } from '../impl';
import { Inject, NotFoundException } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from 'src/modules/users/domain/repositories';
import { User } from 'src/modules/users/domain/entities';

@QueryHandler(GetUserProfileQuery)
export class GetUserProfileHandler
  implements IQueryHandler<GetUserProfileQuery>
{
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async execute(query: GetUserProfileQuery): Promise<User> {
    const user = await this.userRepository.findById(query.userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
