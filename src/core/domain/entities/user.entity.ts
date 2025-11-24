import { Types } from 'mongoose';
import { IUser } from '../interfaces';

export class UserEntity implements IUser {
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

  constructor(partial: Partial<IUser>) {
    Object.assign(this, partial);
  }
}
