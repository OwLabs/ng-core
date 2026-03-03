import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { RefreshToken, RefreshTokenSchema } from './infrastructure/schemas';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  AuthController,
  GoogleAuthController,
} from './presentation/controllers';
import { AuthService, RefreshTokenService } from './services';
import { REFRESH_TOKEN_REPOSITORY } from './domain/repositories';
import { RefreshTokenRepositoryImpl } from './infrastructure/repositories';
import { GoogleStrategy, JwtStrategy, LocalStrategy } from './strategies';
import { EMAIL_SERVICE } from './domain/email-service.interface';
import { ConsoleEmailService } from './infrastructure/console-email/console-email.service';
import { NodemailerEmailService } from './infrastructure/nodemailer-email/nodemailer-email.service';
import { MailerModule } from '@nestjs-modules/mailer';

/**
 * AuthModule — rewired
 *
 * KEY CHANGES:
 *   1. Imports UsersModule (not individual UserRepository/UsersService)
 *   2. Registers RefreshToken schema HERE (not in global DatabaseModule)
 *   3. Uses REFRESH_TOKEN_REPOSITORY Symbol for DI
 *   4. No more core/ imports for repositories
 *
 * NOTICE: Still imports DatabaseModule indirectly through UsersModule
 *   for the MongoDB connection. But the RefreshToken schema is
 *   registered locally with MongooseModule.forFeature()
 */
@Module({
  imports: [
    CqrsModule,
    PassportModule,
    UsersModule,

    // Register RefreshToken schema locally (auth owns it)
    MongooseModule.forFeature([
      { name: RefreshToken.name, schema: RefreshTokenSchema },
    ]),

    // JWT Configuration
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: parseInt(
            configService.getOrThrow<string>('JWT_EXPIRES_IN'),
            10,
          ),
        },
      }),
      inject: [ConfigService],
    }),

    MailerModule.forRootAsync({ 
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get('SMTP_HOST', 'smtp.ethereal.email'),
          port: config.get('SMTP_PORT', 587),
          auth: {
            user: config.get('SMTP_USER'),
            pass: config.get('SMTP_PASS'),
          },
        },
        defaults: {
          from: config.get('SMTP_FROM', '"ng-core" <noreply@example.com>'),
        },
      }),
      inject: [ConfigService],
    }),
  ],

  controllers: [AuthController, GoogleAuthController],
  providers: [
    // Services (auth uses services, not CQRS handlers)
    AuthService,
    RefreshTokenService,

    // Repository - interface token → implementation
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: RefreshTokenRepositoryImpl,
    },
    // Passport strategies — must be registered as providers
    // so NestJS instantiates them and they register with Passport
    LocalStrategy,
    JwtStrategy,
    GoogleStrategy,
    {
      provide: EMAIL_SERVICE,
      useClass:
        process.env.NODE_ENV === 'production'
          ? NodemailerEmailService
          : ConsoleEmailService,
    }
  ],

  exports: [AuthService, RefreshTokenService],
})
export class AuthModule {}
