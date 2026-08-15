import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Brand, BrandDocument } from './brand.schema';
import { CreateBrandDto, UpdateBrandDto } from './brand.dto';
import { Product, ProductDocument } from '../products/product.schema';

export interface BrandWithCount {
  _id: Types.ObjectId | string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  isActive: boolean;
  status: string;
  metaTitle?: string;
  metaDescription?: string;
  productCount: number;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable()
export class BrandsService {
  constructor(
    @InjectModel(Brand.name)
    private readonly brandModel: Model<BrandDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async create(createBrandDto: CreateBrandDto): Promise<BrandDocument> {
    const existingSlug = await this.brandModel
      .findOne({ slug: createBrandDto.slug })
      .exec();
    if (existingSlug) {
      throw new ConflictException(
        `Brand with slug '${createBrandDto.slug}' already exists`,
      );
    }

    const existingName = await this.brandModel
      .findOne({
        name: { $regex: new RegExp(`^${createBrandDto.name}$`, 'i') },
      })
      .exec();
    if (existingName) {
      throw new ConflictException(
        `A brand named '${createBrandDto.name}' already exists`,
      );
    }

    const status =
      createBrandDto.status ||
      (createBrandDto.isActive === false ? 'inactive' : 'active');
    const isActive = status === 'active';

    const created = new this.brandModel({
      ...createBrandDto,
      status,
      isActive,
    });
    return created.save();
  }

  async findAll(): Promise<BrandDocument[]> {
    return this.brandModel
      .find({
        $or: [
          { status: 'active' },
          { status: { $exists: false }, isActive: true },
        ],
      })
      .sort({ name: 1 })
      .exec();
  }

  async findAllAdmin(): Promise<BrandWithCount[]> {
    const brands = await this.brandModel
      .find()
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Aggregate product counts per brand
    const counts = await this.productModel.aggregate<{
      _id: Types.ObjectId;
      count: number;
    }>([
      { $match: { brand: { $ne: null } } },
      { $group: { _id: '$brand', count: { $sum: 1 } } },
    ]);

    const countMap = new Map<string, number>(
      counts.map((c) => [c._id.toString(), c.count]),
    );

    return brands.map((b) => ({
      ...b,
      status: b.status || (b.isActive ? 'active' : 'inactive'),
      productCount: countMap.get(b._id.toString()) || 0,
    }));
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

  async update(
    id: string,
    updateBrandDto: UpdateBrandDto,
  ): Promise<BrandDocument> {
    const brand = await this.findById(id);

    if (updateBrandDto.slug && updateBrandDto.slug !== brand.slug) {
      const existing = await this.brandModel
        .findOne({ slug: updateBrandDto.slug, _id: { $ne: brand._id } })
        .exec();
      if (existing) {
        throw new ConflictException(
          `Brand with slug '${updateBrandDto.slug}' already exists`,
        );
      }
    }

    if (updateBrandDto.name && updateBrandDto.name !== brand.name) {
      const existing = await this.brandModel
        .findOne({
          name: { $regex: new RegExp(`^${updateBrandDto.name}$`, 'i') },
          _id: { $ne: brand._id },
        })
        .exec();
      if (existing) {
        throw new ConflictException(
          `A brand named '${updateBrandDto.name}' already exists`,
        );
      }
    }

    const cleanedDto = cleanUndefined(updateBrandDto);
    if (cleanedDto.status !== undefined) {
      cleanedDto.isActive = cleanedDto.status === 'active';
    } else if (cleanedDto.isActive !== undefined) {
      cleanedDto.status = cleanedDto.isActive ? 'active' : 'inactive';
    }

    Object.assign(brand, cleanedDto);
    return brand.save();
  }

  async remove(
    id: string,
    force = false,
  ): Promise<{ deleted: boolean; productCount: number }> {
    const brand = await this.findById(id);
    const productCount = await this.productModel
      .countDocuments({ brand: brand._id })
      .exec();

    if (productCount > 0 && !force) {
      throw new BadRequestException(
        `Cannot delete brand "${brand.name}" because it is assigned to ${productCount} product${productCount !== 1 ? 's' : ''}. Please archive or reassign products first.`,
      );
    }

    await this.brandModel.deleteOne({ _id: brand._id }).exec();
    return { deleted: true, productCount };
  }
}

function cleanUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      cleaned[key] = value;
    }
  }
  return cleaned as Partial<T>;
}
