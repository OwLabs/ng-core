import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MaterialModule } from './modules/materials/materials.module';
import { WinstonModule } from 'nest-winston';
import {
  HttpLoggerMiddleware,
  winstonConfig,
  ErrorEventListener,
  LogCleanupService,
} from './core/logger';
import { EventEmitterModule } from '@nestjs/event-emitter';
import * as fs from 'fs';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    WinstonModule.forRoot(winstonConfig),
    EventEmitterModule.forRoot(),
    AuthModule,
    UsersModule,
    MaterialModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ErrorEventListener,
    LogCleanupService,
    {
      provide: 'APP_VERSION',
      useFactory: () => {
        try {
          const pkgPath = path.resolve(process.cwd(), 'package.json');
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          return pkg.version || 'unknown';
        } catch {
          return 'unknown';
        }
      },
    },
  ],
})
export class AppModule implements NestModule {
  // Apply HTTP logging middleware to all routes
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
