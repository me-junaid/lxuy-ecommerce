import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, index: true, trim: true })
  slug: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', default: null })
  parent?: Types.ObjectId | null;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ trim: true })
  image?: string;

  @Prop({ trim: true })
  metaTitle?: string;

  @Prop({ trim: true })
  metaDescription?: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Add index on parent for fast subcategory lookups
CategorySchema.index({ parent: 1 });
