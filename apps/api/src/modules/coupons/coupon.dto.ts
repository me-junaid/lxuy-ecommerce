import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class ValidateCouponDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsNumber()
  @Min(0)
  cartSubtotal!: number;
}

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  type!: 'percentage' | 'fixed';

  @IsNumber()
  @Min(0)
  value!: number;

  @IsNumber()
  @Min(0)
  minOrderAmount!: number;
}
