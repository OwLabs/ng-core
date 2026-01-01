import { Types } from 'mongoose';

export type MaterialType = 'document' | 'video';

export interface IMaterial {
  _id?: Types.ObjectId;
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
}
