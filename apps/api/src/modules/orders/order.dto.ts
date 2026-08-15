import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDateString,
  ValidateNested,
  IsMongoId,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { FULFILLMENT_STATUSES } from './order.schema';

// ─── Create Order (used by storefront checkout) ───────────────────────────────

export class ShippingAddressDto {
  @IsString() @IsNotEmpty() firstName: string;
  @IsString() @IsNotEmpty() lastName: string;
  @IsEmail() @IsNotEmpty() email: string;
  @IsString() @IsNotEmpty() phone: string;
  @IsString() @IsNotEmpty() street: string;
  @IsString() @IsOptional() apartment?: string;
  @IsString() @IsNotEmpty() city: string;
  @IsString() @IsNotEmpty() state: string;
  @IsString() @IsNotEmpty() zip: string;
  @IsString() @IsNotEmpty() country: string;
}

export class CreateOrderDto {
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  @IsNotEmpty()
  shippingAddress: ShippingAddressDto;

  @IsEnum(['card', 'upi', 'netbanking', 'cod', 'wallet', 'emi', 'other'])
  @IsNotEmpty()
  paymentMethod: string;

  @IsEnum(['standard', 'express'])
  @IsOptional()
  shippingMethod?: string;

  @IsString()
  @IsOptional()
  couponCode?: string;
}

// ─── Admin: Update Fulfillment Status ─────────────────────────────────────────

export class UpdateFulfillmentStatusDto {
  @IsEnum(FULFILLMENT_STATUSES)
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  shippingProvider?: string;

  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @IsString()
  @IsOptional()
  trackingUrl?: string;

  @IsDateString()
  @IsOptional()
  estimatedDelivery?: string;
}

// ─── Admin: Add Internal Note ─────────────────────────────────────────────────

export class AddOrderNoteDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}

// ─── Admin: Cancel Order ──────────────────────────────────────────────────────

export class CancelOrderDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}

// ─── Admin: List Orders Query ─────────────────────────────────────────────────

export class AdminListOrdersQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(FULFILLMENT_STATUSES)
  status?: string;

  @IsOptional()
  @IsEnum(['pending', 'paid', 'failed', 'refunded', 'partially_refunded'])
  paymentStatus?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['newest', 'oldest', 'total_desc', 'total_asc'])
  sort?: string = 'newest';

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsMongoId()
  userId?: string;
}
