import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CouponDocument = Coupon & Document;

@Schema({ timestamps: true })
export class Coupon {
  @Prop({
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true,
  })
  code!: string;

  @Prop({ required: true, enum: ['percentage', 'fixed'] })
  type!: 'percentage' | 'fixed';

  /**
   * For type=percentage: 0–100 (e.g. 20 means 20%).
   * For type=fixed: absolute rupee amount (e.g. 500 means ₹500 off).
   */
  @Prop({ required: true, type: Number, min: 0 })
  value!: number;

  /** Minimum cart subtotal (before discount) required to apply this coupon. */
  @Prop({ type: Number, default: 0 })
  minOrderAmount!: number;

  /** Maximum total number of redemptions. null = unlimited. */
  @Prop({ type: Number, default: null })
  maxUses!: number | null;

  /** Auto-incremented each time the coupon is redeemed on an order. */
  @Prop({ type: Number, default: 0 })
  usedCount!: number;

  @Prop({ type: Date, default: null })
  expiresAt!: Date | null;

  @Prop({ default: true, index: true })
  isActive!: boolean;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
