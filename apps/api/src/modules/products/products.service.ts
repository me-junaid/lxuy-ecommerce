import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './product.schema';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './product.dto';
import { CategoriesService } from '../categories/categories.service';
import { BrandsService } from '../brands/brands.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly categoriesService: CategoriesService,
    private readonly brandsService: BrandsService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<ProductDocument> {
    // 1. Verify slug uniqueness
    const existingSlug = await this.productModel.findOne({ slug: createProductDto.slug }).exec();
    if (existingSlug) {
      throw new ConflictException(`Product with slug '${createProductDto.slug}' already exists`);
    }

    // 2. Verify Category and Brand exist
    await this.categoriesService.findById(createProductDto.category);
    await this.brandsService.findById(createProductDto.brand);

    // 3. Verify SKU uniqueness globally
    if (createProductDto.variants && createProductDto.variants.length > 0) {
      const skus = createProductDto.variants.map(v => v.sku);
      
      // Check duplicate SKUs in the payload itself
      const hasDuplicateSkuPayload = skus.some((sku, idx) => skus.indexOf(sku) !== idx);
      if (hasDuplicateSkuPayload) {
        throw new BadRequestException('Duplicate SKUs found in create payload');
      }

      // Check unique SKU constraint in database
      const existingSkuProduct = await this.productModel.findOne({ 'variants.sku': { $in: skus } }).exec();
      if (existingSkuProduct) {
        throw new ConflictException('One or more SKU identifiers already exist in the catalog');
      }
    }

    const created = new this.productModel({
      ...createProductDto,
      category: new Types.ObjectId(createProductDto.category),
      brand: new Types.ObjectId(createProductDto.brand),
    });
    return created.save();
  }

  async findAll(queryDto: ProductQueryDto, isAdmin = false) {
    const filters: Record<string, any> = {};

    // 1. Status Filter (Public requests default to published only)
    if (queryDto.status) {
      filters.status = queryDto.status;
    } else if (!isAdmin) {
      filters.status = 'published';
    }

    // 2. Search query (regex match for partial string matching)
    if (queryDto.search) {
      const searchRegex = { $regex: queryDto.search, $options: 'i' };
      filters.$or = [
        { name: searchRegex },
        { description: searchRegex }
      ];
    }

    // 3. Category match
    if (queryDto.category) {
      filters.category = new Types.ObjectId(queryDto.category);
    }

    // 4. Brand match
    if (queryDto.brand) {
      filters.brand = new Types.ObjectId(queryDto.brand);
    }

    // 5. Price range match (matches if any active variant matches pricing)
    const min = queryDto.minPrice ? parseFloat(queryDto.minPrice) : null;
    const max = queryDto.maxPrice ? parseFloat(queryDto.maxPrice) : null;
    if (min !== null || max !== null) {
      const priceFilter: Record<string, any> = {};
      if (min !== null) priceFilter.$gte = min;
      if (max !== null) priceFilter.$lte = max;
      filters['variants.price'] = priceFilter;
    }

    // Pagination
    const page = queryDto.page ? parseInt(queryDto.page) : 1;
    const limit = queryDto.limit ? parseInt(queryDto.limit) : 10;
    const skip = (page - 1) * limit;

    const total = await this.productModel.countDocuments(filters).exec();
    const data = await this.productModel
      .find(filters)
      .populate('category')
      .populate('brand')
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID format');
    }
    const product = await this.productModel
      .findById(id)
      .populate('category')
      .populate('brand')
      .exec();
    if (!product) {
      throw new NotFoundException(`Product with ID '${id}' not found`);
    }
    return product;
  }

  async findBySlug(slug: string): Promise<ProductDocument> {
    const product = await this.productModel
      .findOne({ slug })
      .populate('category')
      .populate('brand')
      .exec();
    if (!product) {
      throw new NotFoundException(`Product with slug '${slug}' not found`);
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductDocument> {
    const product = await this.findById(id);

    // 1. Verify slug uniqueness
    if (updateProductDto.slug && updateProductDto.slug !== product.slug) {
      const existing = await this.productModel.findOne({ slug: updateProductDto.slug }).exec();
      if (existing) {
        throw new ConflictException(`Product with slug '${updateProductDto.slug}' already exists`);
      }
    }

    // 2. Verify Category and Brand
    if (updateProductDto.category) {
      await this.categoriesService.findById(updateProductDto.category);
    }
    if (updateProductDto.brand) {
      await this.brandsService.findById(updateProductDto.brand);
    }

    // 3. Verify SKU uniqueness
    if (updateProductDto.variants) {
      const skus = updateProductDto.variants.map(v => v.sku);
      
      const hasDuplicateSkuPayload = skus.some((sku, idx) => skus.indexOf(sku) !== idx);
      if (hasDuplicateSkuPayload) {
        throw new BadRequestException('Duplicate SKUs found in update payload');
      }

      // Find any product that has these SKUs, excluding this product
      const existingSkuProduct = await this.productModel.findOne({
        _id: { $ne: product._id },
        'variants.sku': { $in: skus },
      }).exec();
      if (existingSkuProduct) {
        throw new ConflictException('One or more SKU identifiers already exist in another product');
      }
    }

    Object.assign(product, {
      ...updateProductDto,
      category: updateProductDto.category ? new Types.ObjectId(updateProductDto.category) : product.category,
      brand: updateProductDto.brand ? new Types.ObjectId(updateProductDto.brand) : product.brand,
    });

    return product.save();
  }

  async remove(id: string): Promise<void> {
    const product = await this.findById(id);
    await this.productModel.deleteOne({ _id: product._id }).exec();
  }
}
