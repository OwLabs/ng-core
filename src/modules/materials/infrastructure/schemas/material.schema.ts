import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * WHY IS THE SCHEMA SEPARATE FROM THE ENTITY?
 *   Entity = domain logic (business rules, validation, encapsulation)
 *   Schema = database structure (Mongoose decorators, indexes, refs)
 *
 *   The entity doesn't know about @Prop or MongoDB.
 *   The schema doesn't know about business methods.
 *   The repository BRIDGES them using fromPersistence() / toPersistence().
 */
@Schema({ timestamps: true })
export class Material extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: ['pdf', 'video', 'image', 'notes'] })
  type: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  topic: string;

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

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  assignedTo: Types.ObjectId[];

  @Prop()
  courseId?: string;
}

export const MaterialSchema = SchemaFactory.createForClass(Material);

/**
 * Text index on title + topic for search functionality
 *
 * This enables: db.materials.find({ $text: { $search: "algebra" } })
 * Which matches documents where title OR topic contains "algebra"
 *
 * WHY TEXT INDEX vs $regex?
 *   $regex: /algebra/i scans every document — slow on large collections
 *   $text: uses an inverted index — fast, like a search engine
 */
MaterialSchema.index({ title: 'text', topic: 'text' });
