import {
  Injectable,
  BadRequestException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Coupon, CouponDocument } from './coupon.schema';

export interface CouponValidationResult {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  discountAmount: number;
}

@Injectable()
export class CouponsService implements OnModuleInit {
  private readonly logger = new Logger(CouponsService.name);

  constructor(
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<CouponDocument>,
  ) {}

  /**
   * Seeds default coupons on startup if they don't already exist.
   */
  async onModuleInit(): Promise<void> {
    const defaults = [
      {
        code: 'LUXURY20',
        type: 'percentage' as const,
        value: 20,
        minOrderAmount: 0,
        maxUses: null,
        isActive: true,
      },
      {
        code: 'WELCOME10',
        type: 'percentage' as const,
        value: 10,
        minOrderAmount: 0,
        maxUses: null,
        isActive: true,
      },
      {
        code: 'FLAT500',
        type: 'fixed' as const,
        value: 500,
        minOrderAmount: 5000,
        maxUses: null,
        isActive: true,
      },
    ];

    for (const coupon of defaults) {
      const exists = await this.couponModel.findOne({ code: coupon.code }).exec();
      if (!exists) {
        await this.couponModel.create(coupon);
        this.logger.log(`Seeded coupon: ${coupon.code}`);
      }
    }
  }

  /**
   * Validates a coupon code against eligibility rules and the given cart subtotal.
   * Does NOT increment usedCount — that happens at order placement.
   */
  async validateCoupon(
    code: string,
    cartSubtotal: number,
  ): Promise<CouponValidationResult> {
    const normalised = code.toUpperCase().trim();
    const coupon = await this.couponModel.findOne({ code: normalised, isActive: true }).exec();

    if (!coupon) {
      throw new BadRequestException('Invalid or inactive promo code.');
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new BadRequestException('This promo code has expired.');
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('This promo code has reached its usage limit.');
    }

    if (cartSubtotal < coupon.minOrderAmount) {
      throw new BadRequestException(
        `A minimum order of ₹${coupon.minOrderAmount.toLocaleString('en-IN')} is required for this promo code.`,
      );
    }

    const discountAmount =
      coupon.type === 'percentage'
        ? (cartSubtotal * coupon.value) / 100
        : Math.min(coupon.value, cartSubtotal); // never discount more than the subtotal

    return {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountAmount,
    };
  }

  /**
   * Atomically increments usedCount for a coupon after a successful order.
   * Silently ignores if the code no longer exists.
   */
  async redeemCoupon(code: string): Promise<void> {
    const normalised = code.toUpperCase().trim();
    await this.couponModel
      .findOneAndUpdate({ code: normalised }, { $inc: { usedCount: 1 } })
      .exec();
  }
}
