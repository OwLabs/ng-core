import { Module } from '@nestjs/common';
import {
  CreateUserHandler,
  UpdateUserRolesHandler,
} from './application/commands/handlers';
import {
  GetAllUsersHandler,
  GetUserByEmailHandler,
  GetUserByIdHandler,
  GetUserProfileHandler,
} from './application/queries/handlers';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from 'src/core/infrastructure/database';
import { UsersController } from './presentation/controllers/users.controller';
import { USER_REPOSITORY } from './domain/repositories';
import { UserRepositoryImpl } from './infrastructure/repositories';
import { User, UserSchema } from './infrastructure/schemas';

const CommandHandlers = [CreateUserHandler, UpdateUserRolesHandler];

const QueryHandlers = [
  GetAllUsersHandler,
  GetUserByEmailHandler,
  GetUserByIdHandler,
  GetUserProfileHandler,
];

@Module({
  imports: [
    CqrsModule,
    DatabaseModule,
    // Users module registers its OWN schema (not relying on DatabaseModule)
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [
    // CQRS handlers - registered with CommandBus/QueryBus automatically
    ...CommandHandlers,
    ...QueryHandlers,

    // Repository - interface token → concrete implementation
    {
      provide: USER_REPOSITORY,
      useClass: UserRepositoryImpl,
    },
  ],
  exports: [
    // Auth module imports UsersModule to access CommandBus/QueryBus handlers
    CqrsModule,
    USER_REPOSITORY,
  ],
})
export class UsersModule {}
