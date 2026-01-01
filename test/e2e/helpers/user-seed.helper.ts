import { RoleEnum } from 'src/common/decorators';
import { UserEntity } from 'src/core/domain/entities';
import { UserRepository } from 'src/core/infrastructure/repositories';
import * as bcrypt from 'bcryptjs';

export async function seedUser(
  userRepo: UserRepository,
  payload: { email: string; name: string; password: string; roles: RoleEnum[] },
): Promise<Omit<UserEntity, 'password'>> {
  const hashed = await bcrypt.hash(payload.password, 10);

  return userRepo.create({
    email: payload.email,
    name: payload.name,
    password: hashed,
    roles: payload.roles,
  });
}
