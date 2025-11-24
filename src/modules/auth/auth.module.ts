import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DatabaseModule } from 'src/core/infrastructure/database';
import { AuthController, GoogleAuthController } from './controllers';
import { AuthService } from './services';
import { GoogleStrategy, JwtStrategy, LocalStrategy } from './strategies';
import {
  RefreshTokenRepository,
  UserRepository,
} from 'src/core/infrastructure/repositories';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenService } from './services/refresh-token.service';
import { UsersService } from '../users/services';

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
    UsersService,
    RefreshTokenService,
    LocalStrategy,
    JwtStrategy,
    UserRepository,
    RefreshTokenRepository,
    GoogleStrategy,
  ],
  exports: [AuthService, RefreshTokenService],
})
export class AuthModule {}
