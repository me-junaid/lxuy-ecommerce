import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wishlist, WishlistDocument } from './wishlist.schema';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist.name)
    private readonly wishlistModel: Model<WishlistDocument>,
  ) {}

  async getWishlist(userId: string): Promise<WishlistDocument> {
    let wishlist = await this.wishlistModel
      .findOne({ user: new Types.ObjectId(userId) })
      .populate({
        path: 'products',
        populate: [{ path: 'category' }, { path: 'brand' }],
      })
      .exec();

    if (!wishlist) {
      wishlist = new this.wishlistModel({
        user: new Types.ObjectId(userId),
        products: [],
      });
      await wishlist.save();
    }

    return wishlist;
  }

  async toggleItem(
    userId: string,
    productId: string,
  ): Promise<WishlistDocument> {
    const userObjectId = new Types.ObjectId(userId);
    const productObjectId = new Types.ObjectId(productId);

    // Try pulling the item first. If it exists in the array, it will be pulled atomically.
    const result = await this.wishlistModel
      .updateOne(
        { user: userObjectId, products: productObjectId },
        { $pull: { products: productObjectId } },
      )
      .exec();

    // If modifiedCount is 0, the item was not present, so we add it atomically.
    if (result.modifiedCount === 0) {
      await this.wishlistModel
        .updateOne(
          { user: userObjectId },
          { $addToSet: { products: productObjectId } },
          { upsert: true },
        )
        .exec();
    }

    return this.getWishlist(userId);
  }

  async addItem(userId: string, productId: string): Promise<WishlistDocument> {
    const userObjectId = new Types.ObjectId(userId);
    const productObjectId = new Types.ObjectId(productId);

    await this.wishlistModel
      .updateOne(
        { user: userObjectId },
        { $addToSet: { products: productObjectId } },
        { upsert: true },
      )
      .exec();

    return this.getWishlist(userId);
  }

  async removeItem(
    userId: string,
    productId: string,
  ): Promise<WishlistDocument> {
    const userObjectId = new Types.ObjectId(userId);
    const productObjectId = new Types.ObjectId(productId);

    await this.wishlistModel
      .updateOne(
        { user: userObjectId },
        { $pull: { products: productObjectId } },
      )
      .exec();

    return this.getWishlist(userId);
  }

  async mergeWishlist(
    userId: string,
    productIds: string[],
  ): Promise<WishlistDocument> {
    const userObjectId = new Types.ObjectId(userId);
    const productObjectIds = productIds.map((id) => new Types.ObjectId(id));

    await this.wishlistModel
      .updateOne(
        { user: userObjectId },
        { $addToSet: { products: { $each: productObjectIds } } },
        { upsert: true },
      )
      .exec();

    return this.getWishlist(userId);
  }
}
