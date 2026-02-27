import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories';
import { InjectModel } from '@nestjs/mongoose';
import { User as UserSchema } from '../schemas';
import { Model } from 'mongoose';
import { User } from '../../domain/entities';
import { AuthProvider, UserRole } from '../../domain/enums';

/**
 * UserRepositoryImpl — Mongoose implementation of IUserRepository
 *
 * === INFRASTRUCTURE LAYER ===
 *
 * WHAT: The concrete database code
 *
 * WHY SEPARATE FROM INTERFACE?
 *   So you can swap databases without touching domain code
 *   Want PostgreSQL later? Create UserPostgresRepository
 *   implementing the same IUserRepository. Domain doesn't change
 *
 * HOW: Maps between two worlds:
 *   Domain World (User entity with value objects like Email, UserName)
 *     ↕  toDomain() / toPersistence()
 *   Database World (Mongoose documents with plain strings)
 *
 * OOP CONCEPT: `implements IUserRepository`
 *   This keyword means "I PROMISE to have all methods from that interface"
 *   If you forget to implement findByEmail(), TypeScript gives you an error
 *   This is called a CONTRACT — the interface defines what must exist
 */
@Injectable()
export class UserRepositoryImpl implements IUserRepository {
  constructor(
    @InjectModel(UserSchema.name) private readonly userModel: Model<UserSchema>,
  ) {}

  async save(user: User): Promise<User> {
    const data = user.toPersistence();
    const existing = await this.userModel.findById(data._id);

    if (existing) {
      const updated = await this.userModel
        .findByIdAndUpdate(data._id, data, { new: true })
        .exec();

      if (!updated) {
        throw new Error('Failed to update user');
      }

      return this.toDomain(updated);
    } else {
      const created = new this.userModel(data);
      const saved = await created.save();
      return this.toDomain(saved);
    }
  }

  async findById(id: string): Promise<User | null> {
    const doc = await this.userModel.findById(id).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.userModel.findOne({ email: { $eq: email } }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByProviderId(providerId: string): Promise<User | null> {
    const doc = await this.userModel
      .findOne({ providerId: { $eq: providerId } })
      .exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(): Promise<User[]> {
    const docs = await this.userModel.find().exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  /**
   * Map Mongoose document → Domain entity
   *
   * WHY PRIVATE? Only this repository class needs this conversion
   * This is the BRIDGE between database world and domain world
   *
   * Uses User.fromPersistence() — the factory that reconstitutes
   * an entity from raw data. The entity handles converting strings
   * back to value objects (Email, UserName) and enums
   */
  private toDomain(doc: any): User {
    return User.fromPersistence({
      id: doc._id,
      email: doc.email,
      name: doc.name,
      password: doc.password ?? null,
      provider: doc.provider ?? AuthProvider.LOCAL,
      providerId: doc.providerId ?? null,
      avatar: doc.avatar ?? null,
      roles: doc.roles ?? [UserRole.LIMITED_ACCESS_USER],
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
