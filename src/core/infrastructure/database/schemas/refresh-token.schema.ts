import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsOptional } from 'class-validator';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class RefreshToken extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  tokenHash: string;

  @Prop()
  @IsOptional()
  userAgent?: string;

  @Prop()
  @IsOptional()
  ip?: string;

  @Prop({ default: false })
  @IsOptional()
  revoked?: boolean;

  @Prop({ required: true })
  expiresAt: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
