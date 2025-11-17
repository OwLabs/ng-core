import { UserEntity } from 'src/core/domain/entities';
import { IUser } from 'src/core/domain/interfaces';

export function sanitizeUser(
  user: IUser | UserEntity,
): Omit<IUser, 'password'> {
  const { password, ...safe } = user;

  return safe as IUser;
}
