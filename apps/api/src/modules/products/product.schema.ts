import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ _id: false })
export class VariantAttribute {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  value: string;
}
export const VariantAttributeSchema = SchemaFactory.createForClass(VariantAttribute);

@Schema({ timestamps: true })
export class ProductVariant {
  @Prop({ required: true, trim: true })
  sku: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ min: 0 })
  compareAtPrice?: number;

  @Prop({ required: true, min: 0, default: 0 })
  stock: number;

  @Prop({ type: [VariantAttributeSchema], default: [] })
  attributes: VariantAttribute[];

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ default: true })
  isActive: boolean;
}
export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, index: true, trim: true })
  slug: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ trim: true })
  summary?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category', required: true })
  category: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Brand', required: true })
  brand: Types.ObjectId;

  @Prop({ required: true, enum: ['draft', 'published', 'archived'], default: 'draft', index: true })
  status: string;

  @Prop({ type: [String], required: true, default: [] })
  images: string[];

  @Prop({ type: [VariantAttributeSchema], default: [] })
  attributes: VariantAttribute[];

  @Prop({ trim: true })
  metaTitle?: string;

  @Prop({ trim: true })
  metaDescription?: string;

  @Prop({ type: [ProductVariantSchema], default: [] })
  variants: ProductVariant[];

  @Prop({
    type: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    default: { average: 0, count: 0 },
    _id: false,
  })
  ratings: {
    average: number;
    count: number;
  };
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Indexes for fast searching and uniqueness
ProductSchema.index({ 'variants.sku': 1 }, { unique: true, sparse: true });
ProductSchema.index({ category: 1 });
ProductSchema.index({ brand: 1 });

// Text index for catalog search
ProductSchema.index({ name: 'text', description: 'text' });
