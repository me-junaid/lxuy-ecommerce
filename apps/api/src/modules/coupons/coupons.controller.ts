import { Controller, Post, Body } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { ValidateCouponDto } from './coupon.dto';

@Controller('api/v1/coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  /**
   * Public endpoint — validates a coupon code against the provided cart subtotal.
   * Returns discount details on success, 400 on failure.
   * Does NOT redeem the coupon (no side effects).
   */
  @Post('validate')
  async validate(@Body() dto: ValidateCouponDto) {
    return this.couponsService.validateCoupon(dto.code, dto.cartSubtotal);
  }
}
