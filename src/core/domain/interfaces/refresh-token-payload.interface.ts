import { IUser } from './user.interface';

export interface RefreshTokenPayload {
  accessToken: string;
  newRefreshToken: string;
  user: IUser;
}
