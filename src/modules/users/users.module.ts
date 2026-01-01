import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/core/infrastructure/database';
import { UsersController } from './controllers';
import { UsersService } from './services';
import { UserRepository } from 'src/core/infrastructure/repositories';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [UsersService, UserRepository],
  exports: [UsersService],
})
export class UsersModule {}
