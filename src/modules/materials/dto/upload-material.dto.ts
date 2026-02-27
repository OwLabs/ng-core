import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { MaterialType } from '../domain/enums';

export class UploadMaterialDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsEnum(MaterialType)
  type: MaterialType;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedTo?: string[];

  @IsOptional()
  @IsString()
  courseId?: string;
}
