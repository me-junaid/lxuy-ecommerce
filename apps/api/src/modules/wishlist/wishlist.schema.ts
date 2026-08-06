import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type WishlistDocument = Wishlist & Document;

@Schema({ timestamps: true })
export class Wishlist {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Product' }], default: [] })
  products: Types.ObjectId[];
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);
