import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Brand, BrandDocument } from './brand.schema';
import { CreateBrandDto, UpdateBrandDto } from './brand.dto';

@Injectable()
export class BrandsService {
  constructor(
    @InjectModel(Brand.name)
    private readonly brandModel: Model<BrandDocument>,
  ) {}

  async create(createBrandDto: CreateBrandDto): Promise<BrandDocument> {
    const existing = await this.brandModel.findOne({ slug: createBrandDto.slug }).exec();
    if (existing) {
      throw new ConflictException(`Brand with slug '${createBrandDto.slug}' already exists`);
    }

    const created = new this.brandModel(createBrandDto);
    return created.save();
  }

  async findAll(): Promise<BrandDocument[]> {
    return this.brandModel.find().exec();
  }

  async findById(id: string): Promise<BrandDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid brand ID format');
    }
    const brand = await this.brandModel.findById(id).exec();
    if (!brand) {
      throw new NotFoundException(`Brand with ID '${id}' not found`);
    }
    return brand;
  }

  async findBySlug(slug: string): Promise<BrandDocument> {
    const brand = await this.brandModel.findOne({ slug }).exec();
    if (!brand) {
      throw new NotFoundException(`Brand with slug '${slug}' not found`);
    }
    return brand;
  }

  async update(id: string, updateBrandDto: UpdateBrandDto): Promise<BrandDocument> {
    const brand = await this.findById(id);

    if (updateBrandDto.slug && updateBrandDto.slug !== brand.slug) {
      const existing = await this.brandModel.findOne({ slug: updateBrandDto.slug }).exec();
      if (existing) {
        throw new ConflictException(`Brand with slug '${updateBrandDto.slug}' already exists`);
      }
    }

    Object.assign(brand, updateBrandDto);
    return brand.save();
  }

  async remove(id: string): Promise<void> {
    const brand = await this.findById(id);
    await this.brandModel.deleteOne({ _id: brand._id }).exec();
  }
}
