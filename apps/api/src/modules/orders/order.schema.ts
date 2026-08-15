import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type OrderDocument = Order & Document;

// ─── Address ──────────────────────────────────────────────────────────────────

@Schema({ _id: false })
export class OrderShippingAddress {
  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ required: true, trim: true })
  street: string;

  @Prop({ trim: true })
  apartment?: string;

  @Prop({ required: true, trim: true })
  city: string;

  @Prop({ required: true, trim: true })
  state: string;

  @Prop({ required: true, trim: true })
  zip: string;

  @Prop({ required: true, trim: true, default: 'India' })
  country: string;
}

export const OrderShippingAddressSchema =
  SchemaFactory.createForClass(OrderShippingAddress);

// ─── Order Item (includes historical snapshot) ────────────────────────────────

@Schema({ _id: false })
export class OrderItem {
  /** Soft reference — product may be archived later; snapshot fields survive */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product' })
  product?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  sku: string;

  @Prop({ required: true, trim: true })
  name: string;

  /** Snapshot of brand name at time of order */
  @Prop({ trim: true })
  brand?: string;

  /** First image URL at time of order */
  @Prop({ trim: true })
  image?: string;

  /** Human-readable variant, e.g. "Size: M · Color: Black" */
  @Prop({ trim: true })
  variantLabel?: string;

  @Prop({ required: true, min: 0 })
  price: number;

  /** Per-item discount at order time */
  @Prop({ min: 0, default: 0 })
  discount: number;

  @Prop({ required: true, min: 1 })
  quantity: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

// ─── Pricing ──────────────────────────────────────────────────────────────────

@Schema({ _id: false })
export class OrderPricing {
  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ required: true, min: 0, default: 0 })
  discount: number;

  @Prop({ required: true, min: 0, default: 0 })
  shippingFee: number;

  @Prop({ required: true, min: 0 })
  tax: number;

  @Prop({ required: true, min: 0 })
  total: number;
}

export const OrderPricingSchema = SchemaFactory.createForClass(OrderPricing);

// ─── Payment ──────────────────────────────────────────────────────────────────

@Schema({ _id: false })
export class OrderPayment {
  @Prop({
    required: true,
    enum: ['card', 'upi', 'netbanking', 'cod', 'wallet', 'emi', 'other'],
    default: 'card',
  })
  method: string;

  @Prop({
    required: true,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending',
  })
  status: string;

  @Prop({ trim: true })
  transactionId?: string;

  @Prop({ type: Date })
  paidAt?: Date;

  @Prop({ min: 0 })
  refundAmount?: number;

  @Prop({ trim: true })
  refundReason?: string;

  @Prop({ trim: true })
  refundId?: string;

  @Prop({ type: Date })
  refundedAt?: Date;
}

export const OrderPaymentSchema = SchemaFactory.createForClass(OrderPayment);

// ─── Fulfillment (shipping tracking) ─────────────────────────────────────────

@Schema({ _id: false })
export class OrderFulfillment {
  @Prop({ trim: true })
  shippingProvider?: string;

  @Prop({ trim: true })
  trackingNumber?: string;

  @Prop({ trim: true })
  trackingUrl?: string;

  @Prop({ type: Date })
  estimatedDelivery?: Date;
}

export const OrderFulfillmentSchema =
  SchemaFactory.createForClass(OrderFulfillment);

// ─── Status History ───────────────────────────────────────────────────────────

@Schema({ _id: false })
export class OrderStatusHistoryEntry {
  @Prop({ required: true })
  status: string;

  @Prop({ trim: true })
  note?: string;

  @Prop({ trim: true })
  updatedBy?: string;

  @Prop({ required: true, type: Date, default: () => new Date() })
  updatedAt: Date;
}

export const OrderStatusHistoryEntrySchema = SchemaFactory.createForClass(
  OrderStatusHistoryEntry,
);

// ─── Internal Notes ───────────────────────────────────────────────────────────

@Schema({ _id: false })
export class OrderNote {
  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ trim: true })
  createdBy?: string;

  @Prop({ required: true, type: Date, default: () => new Date() })
  createdAt: Date;
}

export const OrderNoteSchema = SchemaFactory.createForClass(OrderNote);

// ─── Customer Snapshot ────────────────────────────────────────────────────────

@Schema({ _id: false })
export class CustomerSnapshot {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  email: string;

  @Prop({ trim: true })
  phone?: string;
}

export const CustomerSnapshotSchema =
  SchemaFactory.createForClass(CustomerSnapshot);

// ─── Fulfillment Status Enum ──────────────────────────────────────────────────

export const FULFILLMENT_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned',
] as const;

export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

// ─── Order ────────────────────────────────────────────────────────────────────

@Schema({ timestamps: true })
export class Order {
  /** Human-readable order number — auto-generated pre-save */
  @Prop({ unique: true, index: true, sparse: true, trim: true })
  orderNumber: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user: Types.ObjectId;

  /** Denormalized at order creation — survives user account changes */
  @Prop({ type: CustomerSnapshotSchema })
  customerSnapshot?: CustomerSnapshot;

  @Prop({ type: [OrderItemSchema], required: true, default: [] })
  items: OrderItem[];

  @Prop({ type: OrderShippingAddressSchema, required: true })
  shippingAddress: OrderShippingAddress;

  @Prop({ type: OrderShippingAddressSchema })
  billingAddress?: OrderShippingAddress;

  @Prop({ type: OrderPricingSchema, required: true })
  pricing: OrderPricing;

  @Prop({ type: OrderPaymentSchema, required: true })
  payment: OrderPayment;

  @Prop({ trim: true })
  couponCode?: string;

  @Prop({
    required: true,
    enum: FULFILLMENT_STATUSES,
    default: 'pending',
    index: true,
  })
  status: string;

  @Prop({ type: OrderFulfillmentSchema, default: () => ({}) })
  fulfillment: OrderFulfillment;

  @Prop({ type: [OrderStatusHistoryEntrySchema], default: [] })
  statusHistory: OrderStatusHistoryEntry[];

  @Prop({ type: [OrderNoteSchema], default: [] })
  notes: OrderNote[];
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Auto-generate orderNumber on first save
OrderSchema.pre('save', function (this: OrderDocument) {
  if (!this.isNew || this.orderNumber) return;
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  this.orderNumber = `LXUY-${ts}${rand}`;
});

OrderSchema.index({ 'payment.status': 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ 'pricing.total': -1 });
