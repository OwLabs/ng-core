import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleEnum, ROLES_KEY } from '../decorators';
import { UserExpressRequest } from '../types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<RoleEnum[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<UserExpressRequest>();
    const { user } = request;

    const userRoles: RoleEnum[] = user?.roles ?? [];

    const hasRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      // Drain the multipart stream before throwing exception
      if (request.readable && !request.readableEnded) {
        request.resume();

        // Wait for the stream to finish draining
        await new Promise<void>((resolve) => {
          request.on('end', () => resolve());
          request.on('error', () => resolve());
          setTimeout(() => resolve(), 1000); // 1 seconds
        });
      }

      throw new ForbiddenException(
        'Access denied: you do not have permission to access this resource',
      );
    }

    return true;
  }
}
