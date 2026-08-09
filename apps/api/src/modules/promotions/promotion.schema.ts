import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PromotionDocument = Promotion & Document;

@Schema({ timestamps: true })
export class Promotion {
  /** Main headline text */
  @Prop({ required: true, trim: true })
  title!: string;

  /** Optional sub-text (e.g. coupon code hint) */
  @Prop({ type: String, trim: true, default: null })
  subtitle!: string | null;

  /** CTA button label */
  @Prop({ trim: true, default: 'Shop Now' })
  ctaLabel!: string;

  /** CTA destination URL */
  @Prop({ type: String, trim: true, default: null })
  ctaUrl!: string | null;

  /** CSS hex colour for the banner background */
  @Prop({ trim: true, default: '#111111' })
  bgColor!: string;

  /** CSS hex colour for the banner text */
  @Prop({ trim: true, default: '#FFFFFF' })
  textColor!: string;

  @Prop({ default: true, index: true })
  isActive!: boolean;

  /** Promotion goes live at this datetime. null = always live if isActive. */
  @Prop({ type: Date, default: null })
  startsAt!: Date | null;

  /** Promotion expires at this datetime. null = no expiry. */
  @Prop({ type: Date, default: null })
  endsAt!: Date | null;

  /** Higher number = shown first */
  @Prop({ type: Number, default: 0, index: true })
  priority!: number;
}

export const PromotionSchema = SchemaFactory.createForClass(Promotion);
