import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OtpStatus } from '../../domain/enums';

@Schema({ timestamps: true })
export class OtpToken extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  email: string;
  
  @Prop({ required: true })
  codeHash: string;

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ default: 5 })
  maxAttempts: number;

  @Prop({ default: 0 })
  resendCount: number;

  @Prop({ default: 3 })
  maxResends: number;

  @Prop({
    default: OtpStatus.PENDING,
    enum: Object.values(OtpStatus),
  })
  status: OtpStatus;

  @Prop({ required: true, index: { expires: 0 } })
  expiresAt: Date;
}

export const OtpTokenSchema = SchemaFactory.createForClass(OtpToken);
