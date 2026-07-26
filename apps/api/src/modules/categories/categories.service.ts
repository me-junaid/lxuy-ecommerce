import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from './category.schema';
import { CreateCategoryDto, UpdateCategoryDto } from './category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<CategoryDocument> {
    const existing = await this.categoryModel.findOne({ slug: createCategoryDto.slug }).exec();
    if (existing) {
      throw new ConflictException(`Category with slug '${createCategoryDto.slug}' already exists`);
    }

    if (createCategoryDto.parent) {
      const parentExists = await this.categoryModel.findById(createCategoryDto.parent).exec();
      if (!parentExists) {
        throw new NotFoundException(`Parent category with ID '${createCategoryDto.parent}' not found`);
      }
    }

    const created = new this.categoryModel({
      ...createCategoryDto,
      parent: createCategoryDto.parent ? new Types.ObjectId(createCategoryDto.parent) : null,
    });
    return created.save();
  }

  async findAll(): Promise<CategoryDocument[]> {
    return this.categoryModel.find().populate('parent').exec();
  }

  async findById(id: string): Promise<CategoryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID format');
    }
    const category = await this.categoryModel.findById(id).populate('parent').exec();
    if (!category) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }
    return category;
  }

  async findBySlug(slug: string): Promise<CategoryDocument> {
    const category = await this.categoryModel.findOne({ slug }).populate('parent').exec();
    if (!category) {
      throw new NotFoundException(`Category with slug '${slug}' not found`);
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryDocument> {
    const category = await this.findById(id);

    if (updateCategoryDto.slug && updateCategoryDto.slug !== category.slug) {
      const existing = await this.categoryModel.findOne({ slug: updateCategoryDto.slug }).exec();
      if (existing) {
        throw new ConflictException(`Category with slug '${updateCategoryDto.slug}' already exists`);
      }
    }

    if (updateCategoryDto.parent) {
      if (updateCategoryDto.parent === id) {
        throw new BadRequestException('A category cannot be its own parent');
      }

      // Check circular dependency
      let currentParentId = updateCategoryDto.parent;
      while (currentParentId) {
        const parentNode = await this.categoryModel.findById(currentParentId).exec();
        if (!parentNode) {
          throw new NotFoundException(`Parent category with ID '${currentParentId}' not found`);
        }
        if (parentNode.parent?.toString() === id) {
          throw new BadRequestException('Circular dependency detected: parent category is a child of this category');
        }
        currentParentId = parentNode.parent?.toString() || '';
      }
    }

    Object.assign(category, {
      ...updateCategoryDto,
      parent: updateCategoryDto.parent === null ? null : updateCategoryDto.parent ? new Types.ObjectId(updateCategoryDto.parent) : category.parent,
    });

    return category.save();
  }

  async remove(id: string): Promise<void> {
    const category = await this.findById(id);
    
    // Set child categories parent pointer to null (orphan protection)
    await this.categoryModel.updateMany({ parent: category._id }, { $set: { parent: null } }).exec();

    await this.categoryModel.deleteOne({ _id: category._id }).exec();
  }
}
