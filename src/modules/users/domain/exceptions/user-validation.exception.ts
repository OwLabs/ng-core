import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/core/exceptions/app.exception';
import { UserValidationErrorCodes } from './users-error.codes';

export class UserValidationException extends AppException {
  constructor(
    message: string,
    context: string | object,
    errorCode: UserValidationErrorCodes,
  ) {
    super(message, errorCode, context, HttpStatus.FORBIDDEN);
  }
}
