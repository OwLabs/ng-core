import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UploadMaterialDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(['document', 'video'])
  type: 'document' | 'video';

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsOptional()
  @IsString()
  courseId?: string;
}
