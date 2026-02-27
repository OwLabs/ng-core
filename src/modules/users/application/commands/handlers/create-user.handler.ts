import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserCommand } from '../impl';
import { ConflictException, Inject } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from 'src/modules/users/domain/repositories';
import { User } from 'src/modules/users/domain/entities';

/**
 * Handler for CreateUserCommand
 *
 * === WHERE DOES EACH CONCERN LIVE? ===
 *
 * Duplicate email check  → HERE (application-level coordination)
 * Email format validation → Email value object (domain validation)
 * Name length validation  → UserName value object (domain validation)
 * Default role assignment → User.create() (domain default)
 * Password hashing        → AUTH MODULE (NOT here — auth hashes before sending)
 * Saving to database      → Repository (infrastructure)
 *
 * The handler is the ORCHESTRATOR. It coordinates the steps
 * but doesn't contain business rules (those are in the entity)
 */
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    // 1. Check if email already exists (application-level check)
    const existing = await this.userRepository.findByEmail(command.email);

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // 2. Create domain entity
    // User.create() internally calls Email.create() and UserName.create()
    // which throw errors if data is invalid
    const user = User.create({
      email: command.email,
      name: command.name,
      password: command.password ?? null,
      provider: command.provider,
      providerId: command.providerId ?? null,
      avatar: command.avatar ?? null,
    });

    // 3. Persist via repository
    return this.userRepository.save(user);
  }
}
