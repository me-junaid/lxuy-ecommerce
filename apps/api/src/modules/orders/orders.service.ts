import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './order.schema';
import { CreateOrderDto } from './order.dto';
import { CartService } from '../cart/cart.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    private readonly cartService: CartService,
    private readonly productsService: ProductsService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto): Promise<OrderDocument> {
    // 1. Fetch User's Cart
    const cart = await this.cartService.getCart(userId);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Your shopping cart is empty');
    }

    // 2. Validate items, pricing and stock levels
    const orderItems: any[] = [];
    let subtotal = 0;

    for (const item of cart.items) {
      const productId = item.product._id.toString();
      const product = await this.productsService.findById(productId);
      
      const variant = product.variants.find((v) => v.sku === item.sku);
      if (!variant) {
        throw new BadRequestException(`Product variant SKU ${item.sku} not found`);
      }

      if (!variant.isActive) {
        throw new BadRequestException(`Product variant ${variant.sku} is not active`);
      }

      if (variant.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for variant ${variant.sku}. Available: ${variant.stock}`);
      }

      // Add item to list (using product.name and variant.price snapshot)
      orderItems.push({
        product: product._id,
        sku: item.sku,
        name: product.name,
        price: variant.price,
        quantity: item.quantity,
      });

      subtotal += variant.price * item.quantity;
    }

    // 3. Compute Coupon Discount
    let discountPercent = 0;
    if (dto.couponCode) {
      const code = dto.couponCode.toUpperCase().trim();
      if (code === 'LUXURY20') {
        discountPercent = 20;
      } else if (code === 'WELCOME10') {
        discountPercent = 10;
      }
    }
    const discount = (subtotal * discountPercent) / 100;

    // 4. Compute Shipping Fee
    const shippingFee = dto.shippingMethod === 'express' ? 500 : 0;

    // 5. Compute Tax (18% GST)
    const taxableAmount = subtotal - discount + shippingFee;
    const tax = taxableAmount * 0.18;
    const total = taxableAmount + tax;

    // 6. Deduct Stock Levels Atomically
    for (const item of cart.items) {
      await this.productsService.decrementStock(item.product._id.toString(), item.sku, item.quantity);
    }

    // 7. Save Order Document
    const paymentStatus = dto.paymentMethod === 'cod' ? 'pending' : 'paid';

    const order = new this.orderModel({
      user: new Types.ObjectId(userId),
      items: orderItems,
      shippingAddress: dto.shippingAddress,
      pricing: {
        subtotal,
        discount,
        shippingFee,
        tax,
        total,
      },
      payment: {
        method: dto.paymentMethod,
        status: paymentStatus,
      },
      status: 'pending',
    });

    const savedOrder = await order.save();

    // 8. Clear Cart
    await this.cartService.clearCart(userId);

    return savedOrder;
  }

  async getUserOrders(userId: string): Promise<OrderDocument[]> {
    return this.orderModel
      .find({ user: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getOrderDetails(userId: string, orderId: string, userRole?: string): Promise<OrderDocument> {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID format');
    }

    const order = await this.orderModel
      .findById(orderId)
      .populate({
        path: 'items.product',
        select: 'name slug images',
      })
      .exec();

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Authorization check: User must be owner, or an Admin/Store Manager
    if (order.user.toString() !== userId && userRole !== 'admin' && userRole !== 'store_manager') {
      throw new ForbiddenException('You are not authorized to view this order');
    }

    return order;
  }
}
