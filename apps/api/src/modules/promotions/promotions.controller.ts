import { Controller, Get } from '@nestjs/common';
import { PromotionsService } from './promotions.service';

@Controller('api/v1/promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  /** Public — no auth required. Returns active promotions for the storefront banner. */
  @Get('active')
  async getActivePromotions() {
    return this.promotionsService.getActivePromotions();
  }
}
