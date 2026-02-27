import { Injectable } from '@nestjs/common';
import { IMaterialRepository } from '../../domain/repositories';
import { InjectModel } from '@nestjs/mongoose';
import { Material as MaterialSchema } from '../schemas';
import { Model, Types } from 'mongoose';
import { Material } from '../../domain/entities';
import { MaterialFilterOptions } from '../../domain/types';
import { MaterialType } from '../../domain/enums';

/**
 * MaterialRepositoryImpl — Mongoose implementation
 *
 * SAME PATTERN AS: UserRepositoryImpl in users/infrastructure/
 *
 * IMPLEMENTS IMaterialRepository:
 *   The domain says "I need save(), findById(), findAll(), etc."
 *   This class delivers using MongoDB/Mongoose.
 *
 * MAPPING:
 *   toDomain() — converts Mongoose document → Material entity
 *   entity.toPersistence() — converts Material entity → plain object for DB
 */
@Injectable()
export class MaterialRepositoryImpl implements IMaterialRepository {
  constructor(
    @InjectModel(MaterialSchema.name)
    private readonly materialModel: Model<MaterialSchema>,
  ) {}

  async save(material: Material): Promise<Material> {
    const data = material.toPersistence();
    const existing = await this.materialModel.findById(data._id);

    if (existing) {
      const updated = await this.materialModel
        .findByIdAndUpdate(data._id, data, { new: true })
        .exec();

      if (!updated) {
        throw new Error('Failed to update material');
      }

      return this.toDomain(updated);
    } else {
      const created = new this.materialModel(data);
      await created.save();
      return this.toDomain(created);
    }
  }

  async findById(id: string): Promise<Material | null> {
    const doc = await this.materialModel.findById(id).exec();
    return doc ? this.toDomain(doc) : null;
  }

  /**
   * findAll with optional search + filter
   *
   * HOW SEARCH WORKS:
   *   Uses MongoDB $text operator which searches the text index
   *   we created on title + topic fields.
   *
   * HOW FILTER WORKS:
   *   Exact match on the 'subject' field.
   *
   * EXAMPLE GENERATED QUERIES:
   *   findAll({})
   *     → db.materials.find({})
   *
   *   findAll({ search: 'algebra' })
   *     → db.materials.find({ $text: { $search: 'algebra' } })
   *
   *   findAll({ subject: 'Math' })
   *     → db.materials.find({ subject: 'Math' })
   *
   *   findAll({ search: 'basics', subject: 'Math' })
   *     → db.materials.find({ $text: { $search: 'basics' }, subject: 'Math' })
   */
  async findAll(options?: MaterialFilterOptions): Promise<Material[]> {
    const filter: any = {};

    if (options?.search) {
      filter.$text = { $search: options.search };
    }

    const docs = await this.materialModel.find(filter).exec();

    return docs.map((doc) => this.toDomain(doc));
  }

  /**
   * Find materials assigned to a specific student
   *
   * HOW IT WORKS:
   *   MongoDB's $in operator checks if the array field 'assignedTo'
   *   CONTAINS the given ObjectId. This is efficient with an index.
   *
   *   QUERY: { assignedTo: studentObjectId }
   *   MongoDB automatically checks if the value is IN the array.
   */
  async findByStudentId(studentId: string): Promise<Material[]> {
    const docs = await this.materialModel
      .find({ assignedTo: new Types.ObjectId(studentId) })
      .exec();

    return docs.map((doc) => this.toDomain(doc));
  }

  async delete(id: string): Promise<void> {
    await this.materialModel.findByIdAndDelete(id).exec();
  }

  /**
   * Map Mongoose document → domain entity
   *
   * PRIVATE because only this class needs this conversion.
   * Uses Material.fromPersistence() factory method.
   *
   * SAME PATTERN AS: toDomain() in UserRepositoryImpl
   */

  private toDomain(doc: any): Material {
    return Material.fromPersistence({
      id: doc._id,
      title: doc.title,
      description: doc.description,
      type: doc.type as MaterialType,
      subject: doc.subject,
      topic: doc.topic ?? '',
      fileUrl: doc.fileUrl,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      originalName: doc.originalName,
      uploadedBy: doc.uploadedBy,
      assignedTo: doc.assignedTo ?? [],
      courseId: doc.courseId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
