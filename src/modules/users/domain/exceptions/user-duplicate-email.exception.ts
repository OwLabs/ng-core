import { AppException } from 'src/core/exceptions/app.exception';
import { UsersCommandErrorCodes } from './users-error.codes';
import { HttpStatus } from '@nestjs/common';

export class UserDuplicateEmailException extends AppException {
  constructor(message: string, context: string | object) {
    super(
      message,
      UsersCommandErrorCodes.DUPLICATE_EMAIL,
      context,
      HttpStatus.CONFLICT,
    );
  }
}
