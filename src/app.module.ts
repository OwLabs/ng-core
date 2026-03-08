import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MaterialModule } from './modules/materials/materials.module';
import { WinstonModule } from 'nest-winston';
import { HttpLoggerMiddleware, winstonConfig } from './core/logger';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ErrorEventListener } from './core/logger/error-event.listener';

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
  providers: [AppService, ErrorEventListener],
})
export class AppModule implements NestModule {
  // Apply here for our HTTP middleware to all routes (*)
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
