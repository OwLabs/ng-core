import { AppException } from 'src/core/exceptions/app.exception';
import { UsersNameValueObjectErrorCodes } from './users-error.codes';
import { HttpStatus } from '@nestjs/common';

export class NameExceededException extends AppException {
  constructor(message: string, context: string | object) {
    super(
      message,
      UsersNameValueObjectErrorCodes.EXCEEDED_LENGTH,
      context,
      HttpStatus.BAD_REQUEST,
    );
  }
}
