import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Material } from '../database/schemas';
import { Model } from 'mongoose';
import { IMaterial } from 'src/core/domain/interfaces';
import { MaterialEntity } from 'src/core/domain/entities';

@Injectable()
export class MaterialRepository {
  constructor(
    @InjectModel(Material.name)
    private readonly materialModel: Model<Material>,
  ) {}

  async create(payload: IMaterial): Promise<MaterialEntity> {
    const material = new this.materialModel(payload);
    const saved = await material.save();
    return new MaterialEntity(saved.toObject<IMaterial>());
  }

  /**
   * Switch to .lean().exec() method later when any of these are true:
   * - Material listing is called very frequently
   * - You add pagination / filtering
   * - You expose materials to many users
   * - You have thousands of document materials
   *
   * Steps:
   * - const result = await this.materialModel.find().lean().exec();
   * - return result.map((m) => new MaterialEntity(m as IMaterial));
   * @returns MaterialEntity
   */
  async findAll(): Promise<MaterialEntity[]> {
    const result = await this.materialModel.find().exec();
    return result.map((m) => new MaterialEntity(m.toObject<IMaterial>()));
  }

  async findById(materialId: string): Promise<MaterialEntity | null> {
    const result = await this.materialModel.findById(materialId).exec();
    return result ? new MaterialEntity(result.toObject<IMaterial>()) : null;
  }
}
