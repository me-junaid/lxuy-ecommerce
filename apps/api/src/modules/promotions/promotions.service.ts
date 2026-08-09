import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Promotion, PromotionDocument } from './promotion.schema';

@Injectable()
export class PromotionsService implements OnModuleInit {
  private readonly logger = new Logger(PromotionsService.name);

  constructor(
    @InjectModel(Promotion.name)
    private readonly promotionModel: Model<PromotionDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.promotionModel.countDocuments().exec();
    if (count === 0) {
      await this.promotionModel.create({
        title: 'Complimentary Shipping on Orders Over ₹15,000',
        subtitle: 'Use code LUXURY20 for an additional 20% off',
        ctaLabel: 'Explore Collection',
        ctaUrl: '/collections/new-arrivals',
        bgColor: '#111111',
        textColor: '#C5A880',
        isActive: true,
        priority: 10,
      });
      this.logger.log('Seeded default promotion banner');
    }
  }

  /**
   * Returns all currently active promotions, respecting scheduled start/end times,
   * sorted by priority descending.
   */
  async getActivePromotions(): Promise<PromotionDocument[]> {
    const now = new Date();
    return this.promotionModel
      .find({
        isActive: true,
        $or: [{ startsAt: null }, { startsAt: { $lte: now } }],
        $and: [
          {
            $or: [{ endsAt: null }, { endsAt: { $gte: now } }],
          },
        ],
      })
      .sort({ priority: -1 })
      .exec();
  }
}
