import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './cart.schema';
import { AddCartItemDto, UpdateCartItemDto, GuestCartItemDto } from './cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name)
    private readonly cartModel: Model<CartDocument>,
  ) {}

  async getCart(userId: string): Promise<CartDocument> {
    let cart = await this.cartModel
      .findOne({ user: new Types.ObjectId(userId) })
      .populate({
        path: 'items.product',
        populate: [{ path: 'category' }, { path: 'brand' }],
      })
      .exec();

    if (!cart) {
      cart = new this.cartModel({
        user: new Types.ObjectId(userId),
        items: [],
      });
      await cart.save();
    }

    return cart;
  }

  async addItem(userId: string, dto: AddCartItemDto): Promise<CartDocument> {
    const userObjectId = new Types.ObjectId(userId);
    const productObjectId = new Types.ObjectId(dto.productId);

    let cart = await this.cartModel.findOne({ user: userObjectId }).exec();
    if (!cart) {
      cart = new this.cartModel({ user: userObjectId, items: [] });
    }

    const existingItemIdx = cart.items.findIndex(
      (item) => item.product.toString() === dto.productId && item.sku === dto.sku,
    );

    if (existingItemIdx > -1) {
      cart.items[existingItemIdx].quantity += dto.quantity;
    } else {
      cart.items.push({
        product: productObjectId,
        sku: dto.sku,
        quantity: dto.quantity,
      });
    }

    await cart.save();
    return this.getCart(userId);
  }

  async updateItem(
    userId: string,
    productId: string,
    sku: string,
    dto: UpdateCartItemDto,
  ): Promise<CartDocument> {
    const cart = await this.cartModel.findOne({ user: new Types.ObjectId(userId) }).exec();
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const existingItemIdx = cart.items.findIndex(
      (item) => item.product.toString() === productId && item.sku === sku,
    );

    if (existingItemIdx === -1) {
      throw new NotFoundException('Item not found in cart');
    }

    if (dto.quantity <= 0) {
      cart.items.splice(existingItemIdx, 1);
    } else {
      cart.items[existingItemIdx].quantity = dto.quantity;
    }

    await cart.save();
    return this.getCart(userId);
  }

  async removeItem(userId: string, productId: string, sku: string): Promise<CartDocument> {
    const cart = await this.cartModel.findOne({ user: new Types.ObjectId(userId) }).exec();
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const existingItemIdx = cart.items.findIndex(
      (item) => item.product.toString() === productId && item.sku === sku,
    );

    if (existingItemIdx > -1) {
      cart.items.splice(existingItemIdx, 1);
      await cart.save();
    }

    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<CartDocument> {
    const cart = await this.cartModel.findOne({ user: new Types.ObjectId(userId) }).exec();
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    return this.getCart(userId);
  }

  async mergeCart(userId: string, guestItems: GuestCartItemDto[]): Promise<CartDocument> {
    const userObjectId = new Types.ObjectId(userId);
    let cart = await this.cartModel.findOne({ user: userObjectId }).exec();
    if (!cart) {
      cart = new this.cartModel({ user: userObjectId, items: [] });
    }

    for (const guestItem of guestItems) {
      const existingItemIdx = cart.items.findIndex(
        (item) =>
          item.product.toString() === guestItem.productId && item.sku === guestItem.sku,
      );

      if (existingItemIdx > -1) {
        cart.items[existingItemIdx].quantity += guestItem.quantity;
      } else {
        cart.items.push({
          product: new Types.ObjectId(guestItem.productId),
          sku: guestItem.sku,
          quantity: guestItem.quantity,
        });
      }
    }

    await cart.save();
    return this.getCart(userId);
  }
}
