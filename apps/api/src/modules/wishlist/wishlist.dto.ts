import { IsNotEmpty, IsMongoId, IsArray } from 'class-validator';

export class WishlistItemDto {
  @IsMongoId()
  @IsNotEmpty()
  productId: string;
}

export class MergeWishlistDto {
  @IsArray()
  @IsMongoId({ each: true })
  productIds: string[];
}
