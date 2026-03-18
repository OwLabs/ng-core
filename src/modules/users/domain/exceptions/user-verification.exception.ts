import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/core/exceptions/app.exception';
import { IsUserVerifiedErrorCodes } from './users-error.codes';

export class UserVerificationException extends AppException {
  constructor(
    message: string,
    context: string | object,
    data?: Record<string, any>,
  ) {
    super(
      message,
      IsUserVerifiedErrorCodes.USER_NOT_VERIFIED,
      context,
      HttpStatus.FORBIDDEN,
      data,
    );
  }
}
