import { Controller, Get, Post, Body, Delete, Param, UseGuards } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { WishlistItemDto, MergeWishlistDto } from './wishlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/v1/wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  async getWishlist(@CurrentUser('id') userId: string) {
    return this.wishlistService.getWishlist(userId);
  }

  @Post('toggle')
  async toggleItem(@CurrentUser('id') userId: string, @Body() dto: WishlistItemDto) {
    return this.wishlistService.toggleItem(userId, dto.productId);
  }

  @Post()
  async addItem(@CurrentUser('id') userId: string, @Body() dto: WishlistItemDto) {
    return this.wishlistService.addItem(userId, dto.productId);
  }

  @Delete(':productId')
  async removeItem(@CurrentUser('id') userId: string, @Param('productId') productId: string) {
    return this.wishlistService.removeItem(userId, productId);
  }

  @Post('merge')
  async mergeWishlist(@CurrentUser('id') userId: string, @Body() dto: MergeWishlistDto) {
    return this.wishlistService.mergeWishlist(userId, dto.productIds);
  }
}
