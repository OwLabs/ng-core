import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Material extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: ['document', 'video'] })
  type: string;

  @Prop({ required: true })
  subject: string;

  // File-based materials
  @Prop()
  fileUrl?: string;

  @Prop()
  fileSize?: number;

  @Prop()
  mimeType?: string;

  @Prop()
  originalName?: string;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  uploadedBy: Types.ObjectId;

  // Optional future expansion
  @Prop()
  courseId?: string;
}

export const MaterialSchema = SchemaFactory.createForClass(Material);
