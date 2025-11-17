import { IUser } from 'src/core/domain/interfaces';

export type AuthResult =
  | { success: true; user: IUser }
  | { success: false; message: string };
