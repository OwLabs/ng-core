import { Injectable, NotFoundException } from '@nestjs/common';
import { RoleEnum } from 'src/common/decorators';
import { sanitizeUser } from 'src/common/utils';
import { UserEntity } from 'src/core/domain/entities';
import { UserRepository } from 'src/core/infrastructure/repositories';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async findById(id: string): Promise<UserEntity | null> {
    return this.userRepository.findById(id);
  }

  async updateRoles(
    userId: string,
    roles: RoleEnum[],
  ): Promise<UserEntity | null> {
    const updatedUser = await this.userRepository.updateRoles(userId, roles);

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findByEmail(email);
  }

  async findAll(): Promise<UserEntity[]> {
    return this.userRepository.findAll();
  }

  async getProfile(userId: string): Promise<UserEntity> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return sanitizeUser(user) as UserEntity;
  }
}
