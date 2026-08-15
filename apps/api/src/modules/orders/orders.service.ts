import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Order, OrderDocument, FULFILLMENT_STATUSES } from './order.schema';
import {
  CreateOrderDto,
  UpdateFulfillmentStatusDto,
  AddOrderNoteDto,
  CancelOrderDto,
  AdminListOrdersQueryDto,
} from './order.dto';
import { CartService } from '../cart/cart.service';
import { ProductsService } from '../products/products.service';
import { CouponsService } from '../coupons/coupons.service';

export interface AdminOrdersResult {
  orders: OrderDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  processing: number;
  packed: number;
  shipped: number;
  out_for_delivery: number;
  delivered: number;
  cancelled: number;
  returned: number;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    private readonly cartService: CartService,
    private readonly productsService: ProductsService,
    private readonly couponsService: CouponsService,
  ) {}

  // ─── Storefront: Create Order ──────────────────────────────────────────────

  async createOrder(
    userId: string,
    dto: CreateOrderDto,
  ): Promise<OrderDocument> {
    const cart = await this.cartService.getCart(userId);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Your shopping cart is empty');
    }

    const orderItems: Array<{
      product: Types.ObjectId;
      sku: string;
      name: string;
      brand?: string;
      image?: string;
      variantLabel?: string;
      price: number;
      discount: number;
      quantity: number;
    }> = [];
    let subtotal = 0;

    for (const item of cart.items) {
      const productId = item.product._id.toString();
      const product = await this.productsService.findById(productId);

      const variant = product.variants.find((v) => v.sku === item.sku);
      if (!variant) {
        throw new BadRequestException(
          `Product variant SKU ${item.sku} not found`,
        );
      }
      if (!variant.isActive) {
        throw new BadRequestException(
          `Product variant ${variant.sku} is not active`,
        );
      }
      if (variant.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for variant ${variant.sku}. Available: ${variant.stock}`,
        );
      }

      const sizeAttr = variant.attributes?.find(
        (a) => a.name.toLowerCase() === 'size',
      );
      const colorAttr = variant.attributes?.find(
        (a) => a.name.toLowerCase() === 'color',
      );
      const variantParts: string[] = [];
      if (sizeAttr) variantParts.push(`Size: ${sizeAttr.value}`);
      if (colorAttr) variantParts.push(`Color: ${colorAttr.value}`);

      const brandName =
        product.brand &&
        typeof product.brand === 'object' &&
        'name' in product.brand
          ? (product.brand as { name: string }).name
          : undefined;

      orderItems.push({
        product: product._id,
        sku: item.sku,
        name: product.name,
        brand: brandName,
        image: product.images?.[0],
        variantLabel: variantParts.join(' · ') || undefined,
        price: variant.price,
        discount: 0,
        quantity: item.quantity,
      });

      subtotal += variant.price * item.quantity;
    }

    let discount = 0;
    if (dto.couponCode) {
      try {
        const validation = await this.couponsService.validateCoupon(
          dto.couponCode,
          subtotal,
        );
        discount = validation.discountAmount;
      } catch {
        throw new BadRequestException(`Invalid coupon: ${dto.couponCode}`);
      }
    }

    const shippingFee = dto.shippingMethod === 'express' ? 500 : 0;
    const taxableAmount = subtotal - discount + shippingFee;
    const tax = Math.round(taxableAmount * 0.18);
    const total = taxableAmount + tax;

    for (const item of cart.items) {
      await this.productsService.decrementStock(
        item.product._id.toString(),
        item.sku,
        item.quantity,
      );
    }

    const paymentStatus = dto.paymentMethod === 'cod' ? 'pending' : 'paid';
    const initialStatus = 'pending';

    const order = new this.orderModel({
      user: new Types.ObjectId(userId),
      items: orderItems,
      shippingAddress: dto.shippingAddress,
      pricing: { subtotal, discount, shippingFee, tax, total },
      payment: {
        method: dto.paymentMethod,
        status: paymentStatus,
        paidAt: paymentStatus === 'paid' ? new Date() : undefined,
      },
      couponCode: dto.couponCode,
      status: initialStatus,
      statusHistory: [
        { status: initialStatus, updatedAt: new Date(), updatedBy: 'system' },
      ],
    });

    const savedOrder = await order.save();

    if (dto.couponCode) {
      await this.couponsService.redeemCoupon(dto.couponCode);
    }

    await this.cartService.clearCart(userId);
    return savedOrder;
  }

  // ─── Storefront: User's Own Orders ────────────────────────────────────────

  async getUserOrders(userId: string): Promise<OrderDocument[]> {
    return this.orderModel
      .find({ user: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getOrderDetails(
    userId: string,
    orderId: string,
    userRole?: string,
  ): Promise<OrderDocument> {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID format');
    }

    const order = await this.orderModel
      .findById(orderId)
      .populate({ path: 'items.product', select: 'name slug images' })
      .exec();

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (
      order.user.toString() !== userId &&
      userRole !== 'admin' &&
      userRole !== 'store_manager'
    ) {
      throw new ForbiddenException('You are not authorized to view this order');
    }

    return order;
  }

  // ─── Admin: List Orders (paginated, filtered, sorted) ─────────────────────

  async findAllAdmin(
    query: AdminListOrdersQueryDto,
  ): Promise<AdminOrdersResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query.status) filter.status = query.status;
    if (query.paymentStatus) filter['payment.status'] = query.paymentStatus;
    if (query.userId && Types.ObjectId.isValid(query.userId)) {
      filter.user = new Types.ObjectId(query.userId);
    }

    if (query.dateFrom || query.dateTo) {
      const dateQuery: Record<string, Date> = {};
      if (query.dateFrom) dateQuery.$gte = new Date(query.dateFrom);
      if (query.dateTo) {
        const to = new Date(query.dateTo);
        to.setHours(23, 59, 59, 999);
        dateQuery.$lte = to;
      }
      filter.createdAt = dateQuery;
    }

    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = [
        { orderNumber: regex },
        { 'customerSnapshot.name': regex },
        { 'customerSnapshot.email': regex },
        { 'customerSnapshot.phone': regex },
        { 'shippingAddress.firstName': regex },
        { 'shippingAddress.lastName': regex },
        { 'shippingAddress.email': regex },
        { 'fulfillment.trackingNumber': regex },
      ];
    }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      total_desc: { 'pricing.total': -1 },
      total_asc: { 'pricing.total': 1 },
    };
    const sort = sortMap[query.sort ?? 'newest'] ?? { createdAt: -1 };

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .populate({ path: 'user', select: 'firstName lastName email phone' })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.orderModel.countDocuments(filter).exec(),
    ]);

    return {
      orders: orders as unknown as OrderDocument[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── Admin: Single Order Detail ───────────────────────────────────────────

  async findOneAdmin(orderId: string): Promise<OrderDocument> {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID format');
    }

    const order = await this.orderModel
      .findById(orderId)
      .populate({ path: 'user', select: 'firstName lastName email phone' })
      .populate({ path: 'items.product', select: 'name slug images' })
      .exec();

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    return order;
  }

  // ─── Admin: Order Stats ───────────────────────────────────────────────────

  async getStats(): Promise<OrderStats> {
    const results = await this.orderModel.aggregate<{
      _id: string;
      count: number;
    }>([{ $group: { _id: '$status', count: { $sum: 1 } } }]);

    const stats: OrderStats = {
      total: 0,
      pending: 0,
      confirmed: 0,
      processing: 0,
      packed: 0,
      shipped: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
      returned: 0,
    };

    for (const r of results) {
      const key = r._id as keyof OrderStats;
      if (key in stats) {
        stats[key] = r.count;
        stats.total += r.count;
      }
    }

    return stats;
  }

  // ─── Admin: Update Fulfillment Status ─────────────────────────────────────

  async updateFulfillmentStatus(
    orderId: string,
    dto: UpdateFulfillmentStatusDto,
    adminEmail?: string,
  ): Promise<OrderDocument> {
    const order = await this.findOneAdmin(orderId);

    const prevStatus = order.status;
    const newStatus = dto.status;

    // Guard against moving backwards in a non-sensible way
    const statusOrder = FULFILLMENT_STATUSES;
    const prevIdx = statusOrder.indexOf(
      prevStatus as (typeof FULFILLMENT_STATUSES)[number],
    );
    const newIdx = statusOrder.indexOf(
      newStatus as (typeof FULFILLMENT_STATUSES)[number],
    );

    // Allow: cancelled and returned can always be set; otherwise must progress
    const allowedBack = ['cancelled', 'returned'];
    if (
      !allowedBack.includes(newStatus) &&
      newIdx < prevIdx &&
      prevStatus !== 'cancelled' &&
      prevStatus !== 'returned'
    ) {
      throw new BadRequestException(
        `Cannot move order status from '${prevStatus}' back to '${newStatus}'`,
      );
    }

    order.status = newStatus;

    // Update fulfillment tracking info if provided
    if (!order.fulfillment) order.fulfillment = {};
    if (dto.shippingProvider)
      order.fulfillment.shippingProvider = dto.shippingProvider;
    if (dto.trackingNumber)
      order.fulfillment.trackingNumber = dto.trackingNumber;
    if (dto.trackingUrl) order.fulfillment.trackingUrl = dto.trackingUrl;
    if (dto.estimatedDelivery) {
      order.fulfillment.estimatedDelivery = new Date(dto.estimatedDelivery);
    }

    order.statusHistory.push({
      status: newStatus,
      note: dto.note,
      updatedBy: adminEmail ?? 'admin',
      updatedAt: new Date(),
    });

    order.markModified('fulfillment');
    order.markModified('statusHistory');
    return order.save();
  }

  // ─── Admin: Add Internal Note ─────────────────────────────────────────────

  async addNote(
    orderId: string,
    dto: AddOrderNoteDto,
    adminEmail?: string,
  ): Promise<OrderDocument> {
    const order = await this.findOneAdmin(orderId);

    order.notes.push({
      content: dto.content,
      createdBy: adminEmail ?? 'admin',
      createdAt: new Date(),
    });

    order.markModified('notes');
    return order.save();
  }

  // ─── Admin: Cancel Order ──────────────────────────────────────────────────

  async cancelOrder(
    orderId: string,
    dto: CancelOrderDto,
    adminEmail?: string,
  ): Promise<OrderDocument> {
    const order = await this.findOneAdmin(orderId);

    const terminalStatuses = ['delivered', 'cancelled', 'returned'];
    if (terminalStatuses.includes(order.status)) {
      throw new BadRequestException(
        `Cannot cancel an order with status '${order.status}'`,
      );
    }

    order.status = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      note: `Cancellation reason: ${dto.reason}`,
      updatedBy: adminEmail ?? 'admin',
      updatedAt: new Date(),
    });

    order.markModified('statusHistory');
    return order.save();
  }

  // ─── Admin: Export CSV ────────────────────────────────────────────────────

  async exportCsv(query: AdminListOrdersQueryDto): Promise<string> {
    // Fetch all matching (no pagination cap for export)
    const exportQuery = { ...query, page: 1, limit: 10000 };
    const { orders } = await this.findAllAdmin(exportQuery);

    const headers = [
      'Order Number',
      'Date',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Items',
      'Subtotal',
      'Discount',
      'Shipping',
      'Tax',
      'Total',
      'Payment Status',
      'Payment Method',
      'Fulfillment Status',
      'Tracking Number',
      'Coupon Code',
    ].join(',');

    const rows = orders.map((o) => {
      const snapshot = o.customerSnapshot;
      const name =
        snapshot?.name ??
        `${o.shippingAddress.firstName} ${o.shippingAddress.lastName}`;
      const email = snapshot?.email ?? o.shippingAddress.email;
      const phone = snapshot?.phone ?? o.shippingAddress.phone;
      const items = o.items.length;
      const date =
        (o as unknown as { createdAt: Date }).createdAt
          ?.toISOString()
          .split('T')[0] ?? '';

      const csv = (v: string | number | undefined) =>
        `"${String(v ?? '').replace(/"/g, '""')}"`;

      return [
        csv(o.orderNumber),
        csv(date),
        csv(name),
        csv(email),
        csv(phone),
        items,
        o.pricing.subtotal,
        o.pricing.discount,
        o.pricing.shippingFee,
        o.pricing.tax,
        o.pricing.total,
        csv(o.payment.status),
        csv(o.payment.method),
        csv(o.status),
        csv(o.fulfillment?.trackingNumber),
        csv(o.couponCode),
      ].join(',');
    });

    return [headers, ...rows].join('\n');
  }
}
