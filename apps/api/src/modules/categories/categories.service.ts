import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from './category.schema';
import { CreateCategoryDto, UpdateCategoryDto } from './category.dto';
import { Product, ProductDocument } from '../products/product.schema';

export interface CategoryWithCount {
  _id: Types.ObjectId | string;
  name: string;
  slug: string;
  description?: string;
  parent?: CategoryDocument | Types.ObjectId | null;
  isActive: boolean;
  status: string;
  image?: string;
  metaTitle?: string;
  metaDescription?: string;
  productCount: number;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryDocument> {
    const existingSlug = await this.categoryModel
      .findOne({ slug: createCategoryDto.slug })
      .exec();
    if (existingSlug) {
      throw new ConflictException(
        `Category with slug '${createCategoryDto.slug}' already exists`,
      );
    }

    const existingName = await this.categoryModel
      .findOne({
        name: { $regex: new RegExp(`^${createCategoryDto.name}$`, 'i') },
      })
      .exec();
    if (existingName) {
      throw new ConflictException(
        `A category named '${createCategoryDto.name}' already exists`,
      );
    }

    if (createCategoryDto.parent) {
      const parentExists = await this.categoryModel
        .findById(createCategoryDto.parent)
        .exec();
      if (!parentExists) {
        throw new NotFoundException(
          `Parent category with ID '${createCategoryDto.parent}' not found`,
        );
      }
    }

    const status =
      createCategoryDto.status ||
      (createCategoryDto.isActive === false ? 'inactive' : 'active');
    const isActive = status === 'active';

    const created = new this.categoryModel({
      ...createCategoryDto,
      parent: createCategoryDto.parent
        ? new Types.ObjectId(createCategoryDto.parent)
        : null,
      status,
      isActive,
    });
    return created.save();
  }

  async findAll(): Promise<CategoryDocument[]> {
    return this.categoryModel
      .find({
        $or: [
          { status: 'active' },
          { status: { $exists: false }, isActive: true },
        ],
      })
      .populate('parent')
      .sort({ name: 1 })
      .exec();
  }

  async findAllAdmin(): Promise<CategoryWithCount[]> {
    const categories = await this.categoryModel
      .find()
      .populate('parent')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Aggregate product counts per category
    const counts = await this.productModel.aggregate<{
      _id: Types.ObjectId;
      count: number;
    }>([
      { $match: { category: { $ne: null } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const countMap = new Map<string, number>(
      counts.map((c) => [c._id.toString(), c.count]),
    );

    return categories.map((c) => ({
      ...c,
      status: c.status || (c.isActive ? 'active' : 'inactive'),
      productCount: countMap.get(c._id.toString()) || 0,
    }));
  }

  async findById(id: string): Promise<CategoryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID format');
    }
    const category = await this.categoryModel
      .findById(id)
      .populate('parent')
      .exec();
    if (!category) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }
    return category;
  }

  async findBySlug(slug: string): Promise<CategoryDocument> {
    const category = await this.categoryModel
      .findOne({ slug })
      .populate('parent')
      .exec();
    if (!category) {
      throw new NotFoundException(`Category with slug '${slug}' not found`);
    }
    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryDocument> {
    const category = await this.findById(id);

    if (updateCategoryDto.slug && updateCategoryDto.slug !== category.slug) {
      const existing = await this.categoryModel
        .findOne({ slug: updateCategoryDto.slug, _id: { $ne: category._id } })
        .exec();
      if (existing) {
        throw new ConflictException(
          `Category with slug '${updateCategoryDto.slug}' already exists`,
        );
      }
    }

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existing = await this.categoryModel
        .findOne({
          name: { $regex: new RegExp(`^${updateCategoryDto.name}$`, 'i') },
          _id: { $ne: category._id },
        })
        .exec();
      if (existing) {
        throw new ConflictException(
          `A category named '${updateCategoryDto.name}' already exists`,
        );
      }
    }

    if (updateCategoryDto.parent) {
      if (updateCategoryDto.parent === id) {
        throw new BadRequestException('A category cannot be its own parent');
      }

      // Check circular dependency
      let currentParentId = updateCategoryDto.parent;
      while (currentParentId) {
        const parentNode = await this.categoryModel
          .findById(currentParentId)
          .exec();
        if (!parentNode) {
          throw new NotFoundException(
            `Parent category with ID '${currentParentId}' not found`,
          );
        }
        if (parentNode.parent?.toString() === id) {
          throw new BadRequestException(
            'Circular dependency detected: parent category is a child of this category',
          );
        }
        currentParentId = parentNode.parent?.toString() || '';
      }
    }

    const cleanedDto = cleanUndefined(updateCategoryDto);
    if (cleanedDto.status !== undefined) {
      cleanedDto.isActive = cleanedDto.status === 'active';
    } else if (cleanedDto.isActive !== undefined) {
      cleanedDto.status = cleanedDto.isActive ? 'active' : 'inactive';
    }

    Object.assign(category, {
      ...cleanedDto,
      parent:
        cleanedDto.parent === null
          ? null
          : cleanedDto.parent
            ? new Types.ObjectId(cleanedDto.parent)
            : category.parent,
    });

    return category.save();
  }

  async remove(
    id: string,
    force = false,
  ): Promise<{ deleted: boolean; productCount: number }> {
    const category = await this.findById(id);
    const productCount = await this.productModel
      .countDocuments({ category: category._id })
      .exec();

    if (productCount > 0 && !force) {
      throw new BadRequestException(
        `Cannot delete category "${category.name}" because it is assigned to ${productCount} product${productCount !== 1 ? 's' : ''}. Please archive or reassign products first.`,
      );
    }

    // Set child categories parent pointer to null (orphan protection)
    await this.categoryModel
      .updateMany({ parent: category._id }, { $set: { parent: null } })
      .exec();

    await this.categoryModel.deleteOne({ _id: category._id }).exec();
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
