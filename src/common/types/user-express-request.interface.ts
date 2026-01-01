import { Request } from 'express';
import { Readable } from 'stream';
import { RoleEnum } from '../decorators';

/**
 * Extended Express Request interface that includes:
 * - Stream properties (readable, readableEnded, etc.) for handling file uploads
 * - User authentication data attached by JwtAuthGuard
 */
export interface UserExpressRequest extends Request, Readable {
  user?: {
    userId: string;
    email: string;
    roles: RoleEnum[];
  };
}
