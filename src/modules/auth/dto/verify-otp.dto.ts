import { IsMongoId, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsMongoId()
  otpTokenId: string;

  @IsString()
  @Length(6, 6)
  code: string;
}
