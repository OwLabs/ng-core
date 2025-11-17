import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  password?: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: 'local' })
  provider?: 'local' | 'google';

  @Prop()
  providerId?: string;

  @Prop({ type: [String], default: ['user'] })
  roles?: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
