import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DatabaseModule } from 'src/core/infrastructure/database';
import { AuthController, GoogleAuthController } from './controllers';
import { AuthService } from './services';
import { GoogleStrategy, JwtStrategy, LocalStrategy } from './strategies';
import { UserRepository } from 'src/core/infrastructure/repositories';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    CqrsModule,
    DatabaseModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: parseInt(configService.get<string>('JWT_EXPIRES_IN')!, 10),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, GoogleAuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    UserRepository,
    GoogleStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
