import { Types } from 'mongoose';
import { IMaterial, MaterialType } from '../interfaces/material.interface';

export class MaterialEntity implements IMaterial {
  _id: Types.ObjectId;
  title: string;
  description: string;
  type: MaterialType;
  subject: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  originalName?: string;
  uploadedBy: Types.ObjectId;
  courseId?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(partial: Partial<IMaterial>) {
    Object.assign(this, partial);
  }
}
