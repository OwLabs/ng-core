import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../database/schemas';
import { Model } from 'mongoose';
import { IUser } from 'src/core/domain/interfaces';
import { UserEntity } from 'src/core/domain/entities';
import { RoleEnum } from 'src/common/decorators';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async create(user: IUser): Promise<UserEntity> {
    const createdUser = new this.userModel(user);
    const savedUserIntoDb = await createdUser.save();
    return new UserEntity(savedUserIntoDb.toObject<IUser>());
  }

  async findAll(): Promise<UserEntity[]> {
    const result = await this.userModel.find().select('-password').exec();
    return result.map((u) => new UserEntity(u.toObject<IUser>()));
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const result = await this.userModel
      .findOne({ email: { $eq: email } })
      .exec();
    return result ? new UserEntity(result.toObject<IUser>()) : null;
  }

  async findByProviderId(providerId: string): Promise<UserEntity | null> {
    const result = await this.userModel
      .findOne({ providerId: { $eq: providerId } })
      .exec();
    return result ? new UserEntity(result.toObject<IUser>()) : null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const result = await this.userModel.findById(id).select('-password').exec();
    return result ? new UserEntity(result.toObject<IUser>()) : null;
  }

  async updateRoles(id: string, roles: RoleEnum[]): Promise<UserEntity | null> {
    const updated = await this.userModel
      .findByIdAndUpdate(id, { roles }, { new: true })
      .exec();

    return updated ? new UserEntity(updated.toObject<IUser>()) : null;
  }
}
