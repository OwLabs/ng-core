import { IsMongoId, IsString, Length } from 'class-validator';

export class verifyOtpDto {
  @IsMongoId()
  otpTokenId: string;

  @IsString()
  @Length(6, 6)
  code: string;
}
