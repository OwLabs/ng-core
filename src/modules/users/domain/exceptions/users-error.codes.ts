export enum UsersCommandErrorCodes {
  DUPLICATE_EMAIL = 'EMAIL_EXISTED_IN_DATABASE',
}

export enum UsersNameValueObjectErrorCodes {
  LESS_LENGTH = 'NAME_LESS_THAN_2_CHARACTERS',
  EXCEEDED_LENGTH = 'NAME_EXCEEDED_100_CHARACTERS',
}

export enum EmailValueObjectErrorCodes {
  INVALID_EMAIL = 'EMAIL_DOMAIN_OR_TLD_NOT_ALLOWED',
}
