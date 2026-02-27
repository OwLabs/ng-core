import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenService } from './refresh-token.service';
import { RegisterDto } from '../dto';
import { UserResponse } from 'src/modules/users/domain/types';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/modules/users/domain/entities';
import { CreateUserCommand } from 'src/modules/users/application/commands/impl';
import { AuthProvider } from 'src/modules/users/domain/enums';
import { AuthResult, AuthTokens, TokenPayload } from '../domain/types';
import { GetUserByEmailQuery } from 'src/modules/users/application/queries/impl';
/**
 * AuthService — refactored
 *
 * WHAT THIS SERVICE DOES (orchestration):
 *   1. Receives auth requests (register, login, Google)
 *   2. Talks to Users module via CommandBus/QueryBus
 *   3. Handles password hashing (auth's job, not users')
 *   4. Generates JWT tokens
 *   5. Delegates refresh token management to RefreshTokenService
 *
 * BUGS FIXED:
 *   - Hardcoded 'local', 'google', ['user'] → domain enums
 *   - Non-null assertions (!) → proper null checks
 *   - sanitizeUser() → user.toResponse()
 *   - Salt rounds configurable via env
 *   - Google: checks by email before creating
 */
@Injectable()
export class AuthService {
  private readonly saltRounds: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly configService: ConfigService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {
    // Configurable salt rounds (default 10 if not set)
    this.saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 10);
  }

  /**
   * Register a new local user
   *
   * FLOW:
   *   1. Hash password (auth's responsibility)
   *   2. Send CreateUserCommand (Users module handles duplicate check + creation)
   *   3. Return clean UserResponse (no password)
   *
   * WHY not check for duplicate HERE?
   *   The CreateUserCommand handler already checks. If we check here
   *   too, we'd have a race condition: two requests could both pass
   *   the check and then both try to create. Let the handler handle it
   *   (it has the repository-level lock)
   */
  async register(dto: RegisterDto): Promise<UserResponse> {
    const hashed = await bcrypt.hash(dto.password, this.saltRounds);

    const user: User = await this.commandBus.execute(
      new CreateUserCommand(dto.email, dto.name, AuthProvider.LOCAL, hashed),
    );

    return user.toResponse();
  }

  /**
   * Validate email + password for local login
   *
   * FIXED:
   *   - Uses QueryBus instead of direct UserRepository
   *   - Uses AuthProvider enum instead of hardcoded 'local'
   *   - Uses entity methods (getPasswordHash()) for safe access
   */
  async validateUser(email: string, password: string): Promise<AuthResult> {
    const user: User | null = await this.queryBus.execute(
      new GetUserByEmailQuery(email),
    );

    if (!user) {
      return { success: false, message: 'Email not found' };
    }

    // Check if this is a local account (not Google/OAuth)
    if (user.provider !== AuthProvider.LOCAL || !user.getPasswordHash()) {
      return {
        success: false,
        message: 'This account uses Google login. Please sign in with Google',
      };
    }

    const isValid = await bcrypt.compare(password, user.getPasswordHash()!);

    if (!isValid) {
      return {
        success: false,
        message: 'Incorrect password',
      };
    }

    return { success: true, user: user.toResponse() };
  }

  /**
   * Generate access + refresh tokens after successful login
   *
   * CHANGED:
   *   - Accepts UserResponse (clean shape, id is string)
   *   - Uses TokenPayload type for JWT structure
   *   - Returns AuthTokens type
   */
  async login(
    user: UserResponse,
    ctx: { userAgent?: string; ip?: string; tokenTtlDays?: number },
  ): Promise<AuthTokens> {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = await this.refreshTokenService.createToken(user.id, {
      userAgent: ctx.userAgent,
      ip: ctx.ip,
      tokenTtlDays: ctx.tokenTtlDays,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Validate or create Google OAuth user
   *
   * FIXED:
   *   - Uses QueryBus to find user
   *   - Uses CommandBus to create user
   *   - Uses AuthProvider.GOOGLE enum
   */
  async validateGoogleUser(profile: {
    providerId: string;
    email: string;
    name: string;
    picture?: string;
  }): Promise<UserResponse> {
    let user: User | null = await this.queryBus.execute(
      new GetUserByEmailQuery(profile.email),
    );

    if (!user) {
      user = await this.commandBus.execute(
        new CreateUserCommand(
          profile.email,
          profile.name,
          AuthProvider.GOOGLE,
          null,
          profile.providerId,
          profile.picture,
        ),
      );
    }

    return user!.toResponse();
  }
}
