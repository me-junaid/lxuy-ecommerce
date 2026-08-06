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

  async toggleItem(userId: string, productId: string): Promise<WishlistDocument> {
    const userObjectId = new Types.ObjectId(userId);
    const productObjectId = new Types.ObjectId(productId);

    let wishlist = await this.wishlistModel.findOne({ user: userObjectId }).exec();
    if (!wishlist) {
      wishlist = new this.wishlistModel({ user: userObjectId, products: [] });
    }

    const index = wishlist.products.findIndex((p) => p.toString() === productId);
    if (index > -1) {
      wishlist.products.splice(index, 1);
    } else {
      wishlist.products.push(productObjectId);
    }

    await wishlist.save();
    return this.getWishlist(userId);
  }

  async addItem(userId: string, productId: string): Promise<WishlistDocument> {
    const userObjectId = new Types.ObjectId(userId);
    const productObjectId = new Types.ObjectId(productId);

    let wishlist = await this.wishlistModel.findOne({ user: userObjectId }).exec();
    if (!wishlist) {
      wishlist = new this.wishlistModel({ user: userObjectId, products: [] });
    }

    const exists = wishlist.products.some((p) => p.toString() === productId);
    if (!exists) {
      wishlist.products.push(productObjectId);
      await wishlist.save();
    }

    return this.getWishlist(userId);
  }

  async removeItem(userId: string, productId: string): Promise<WishlistDocument> {
    const userObjectId = new Types.ObjectId(userId);
    const wishlist = await this.wishlistModel.findOne({ user: userObjectId }).exec();
    if (wishlist) {
      const index = wishlist.products.findIndex((p) => p.toString() === productId);
      if (index > -1) {
        wishlist.products.splice(index, 1);
        await wishlist.save();
      }
    }

    return this.getWishlist(userId);
  }

  async mergeWishlist(userId: string, productIds: string[]): Promise<WishlistDocument> {
    const userObjectId = new Types.ObjectId(userId);
    let wishlist = await this.wishlistModel.findOne({ user: userObjectId }).exec();
    if (!wishlist) {
      wishlist = new this.wishlistModel({ user: userObjectId, products: [] });
    }

    for (const id of productIds) {
      const productObjectId = new Types.ObjectId(id);
      const exists = wishlist.products.some((p) => p.toString() === id);
      if (!exists) {
        wishlist.products.push(productObjectId);
      }
    }

    await wishlist.save();
    return this.getWishlist(userId);
  }
}
