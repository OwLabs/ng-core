import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export enum RoleEnum {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  STUDENT = 'student',
  TUTOR = 'tutor',
  PARENT = 'parent',
}

export const Roles = (...roles: RoleEnum[]) => SetMetadata(ROLES_KEY, roles);
