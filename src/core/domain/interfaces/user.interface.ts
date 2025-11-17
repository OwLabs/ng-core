import { Types } from 'mongoose';

export interface IUser {
  _id?: Types.ObjectId;
  email: string;
  password?: string | null;
  name: string;
  provider?: 'local' | 'google';
  providerId?: string;
  avatar?: string;
  roles?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
