import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsNumber, IsBoolean, IsMongoId, Matches, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class VariantAttributeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  value: string;
}

export class ProductVariantDto {
  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  compareAtPrice?: number;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantAttributeDto)
  @IsOptional()
  attributes?: VariantAttributeDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain only lowercase alphanumeric characters and dashes, and cannot start or end with a dash',
  })
  slug: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsMongoId()
  @IsNotEmpty()
  category: string;

  @IsMongoId()
  @IsNotEmpty()
  brand: string;

  @IsEnum(['draft', 'published', 'archived'])
  @IsOptional()
  status?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantAttributeDto)
  @IsOptional()
  attributes?: VariantAttributeDto[];

  @IsString()
  @IsOptional()
  metaTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  @IsOptional()
  variants?: ProductVariantDto[];
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain only lowercase alphanumeric characters and dashes, and cannot start or end with a dash',
  })
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsMongoId()
  @IsOptional()
  category?: string;

  @IsMongoId()
  @IsOptional()
  brand?: string;

  @IsEnum(['draft', 'published', 'archived'])
  @IsOptional()
  status?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantAttributeDto)
  @IsOptional()
  attributes?: VariantAttributeDto[];

  @IsString()
  @IsOptional()
  metaTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  @IsOptional()
  variants?: ProductVariantDto[];
}

export class ProductQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsMongoId()
  @IsOptional()
  category?: string;

  @IsMongoId()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  minPrice?: string;

  @IsString()
  @IsOptional()
  maxPrice?: string;

  @IsEnum(['draft', 'published', 'archived'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  page?: string;

  @IsString()
  @IsOptional()
  limit?: string;
}
