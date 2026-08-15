import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type WishlistDocument = Wishlist & Document;

@Schema({ timestamps: true })
export class Wishlist {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  user: Types.ObjectId;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Product' }],
    default: [],
  })
  products: Types.ObjectId[];
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);

interface PopulatedProduct {
  _id: Types.ObjectId | string;
}

WishlistSchema.pre<WishlistDocument>('save', function () {
  if (this.products && this.products.length > 0) {
    const seen = new Set<string>();
    const unique: Types.ObjectId[] = [];
    for (const p of this.products) {
      if (!p) continue;
      const idStr =
        p instanceof Types.ObjectId
          ? p.toString()
          : typeof p === 'object' && p && '_id' in p
            ? String((p as unknown as PopulatedProduct)._id)
            : String(p);
      if (idStr && !seen.has(idStr)) {
        seen.add(idStr);
        unique.push(
          p instanceof Types.ObjectId ? p : new Types.ObjectId(idStr),
        );
      }
    }
    this.products = unique;
  }
});
