import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ _id: false })
export class OrderShippingAddress {
  @Prop({ required: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

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

export const OrderShippingAddressSchema = SchemaFactory.createForClass(OrderShippingAddress);

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ required: true, trim: true })
  sku: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, min: 1 })
  quantity: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

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

@Schema({ _id: false })
export class OrderPayment {
  @Prop({ required: true, enum: ['card', 'upi', 'cod'], default: 'card' })
  method: string;

  @Prop({ required: true, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' })
  status: string;

  @Prop({ trim: true })
  transactionId?: string;
}

export const OrderPaymentSchema = SchemaFactory.createForClass(OrderPayment);

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], required: true, default: [] })
  items: OrderItem[];

  @Prop({ type: OrderShippingAddressSchema, required: true })
  shippingAddress: OrderShippingAddress;

  @Prop({ type: OrderPricingSchema, required: true })
  pricing: OrderPricing;

  @Prop({ type: OrderPaymentSchema, required: true })
  payment: OrderPayment;

  @Prop({
    required: true,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    index: true,
  })
  status: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
