import { Request } from 'express';
import { Readable } from 'stream';
import { UserRole } from 'src/modules/users/domain/enums';

/**
 * Extended Express Request interface that includes:
 * - Stream properties (readable, readableEnded, etc.) for handling file uploads
 * - User authentication data attached by JwtAuthGuard
 */
export interface UserExpressRequest extends Request, Readable {
  user: {
    userId: string;
    email: string;
    roles: UserRole[];
  };
}
