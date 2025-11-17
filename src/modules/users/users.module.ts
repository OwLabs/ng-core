import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/core/infrastructure/database';
import { UsersController } from './controllers';
import { UsersService } from './services';
import { UserRepository } from 'src/core/infrastructure/repositories';
import { RolesGuard } from 'src/common/guards';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [UsersService, UserRepository, RolesGuard],
  exports: [UsersService],
})
export class UsersModule {}
