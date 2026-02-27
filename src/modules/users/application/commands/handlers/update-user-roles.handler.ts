import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateUserRolesCommand } from '../impl';
import { Inject, NotFoundException } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from 'src/modules/users/domain/repositories';
import { User } from 'src/modules/users/domain/entities';

/**
 * Handler for UpdateUserRolesCommand.
 *
 * THE PATTERN — every command handler follows these steps:
 *   1. Load entity from repository
 *   2. Call business method on entity (entity validates the change)
 *   3. Save entity back to repository
 *
 * WHY? Clean separation:
 *   Handler → orchestration (load, save)
 *   Entity → validation (must have at least 1 role)
 *   Repository → persistence (MongoDB)
 */
@CommandHandler(UpdateUserRolesCommand)
export class UpdateUserRolesHandler
  implements ICommandHandler<UpdateUserRolesCommand>
{
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: UpdateUserRolesCommand): Promise<User> {
    // 1. Load entity
    const user = await this.userRepository.findById(command.userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. Business method (entity validates internally)
    user.updateRoles(command.roles);

    // 3. Persist updated entity
    return this.userRepository.save(user);
  }
}
