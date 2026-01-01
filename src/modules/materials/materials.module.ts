import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DatabaseModule } from 'src/core/infrastructure/database';
import { MaterialController } from './controllers/material.controller';
import { MaterialService } from './services';
import { MaterialRepository } from 'src/core/infrastructure/repositories';

@Module({
  imports: [
    DatabaseModule,
    MulterModule.register({
      dest: './uploads',
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),
  ],
  controllers: [MaterialController],
  providers: [MaterialService, MaterialRepository],
  exports: [MaterialService],
})
export class MaterialModule {}
