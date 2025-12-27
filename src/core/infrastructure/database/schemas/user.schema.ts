import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  @IsNotEmpty()
  email: string;

  @Prop({ type: String })
  @IsOptional()
  password?: string | null;

  @Prop({ required: true })
  name: string;

  @Prop({ default: 'local' })
  @IsOptional()
  provider?: 'local' | 'google';

  @Prop()
  @IsOptional()
  providerId?: string;

  @Prop({ type: String })
  @IsOptional()
  avatar?: string | null;

  @Prop({ type: [String], default: ['user'] })
  @IsOptional()
  roles?: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
