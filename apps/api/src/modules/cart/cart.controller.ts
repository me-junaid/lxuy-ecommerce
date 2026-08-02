import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, Query } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddCartItemDto, UpdateCartItemDto, MergeCartDto } from './cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/v1/cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@CurrentUser('id') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Post('items')
  async addItem(@CurrentUser('id') userId: string, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(userId, dto);
  }

  @Patch('items/:productId')
  async updateItem(
    @CurrentUser('id') userId: string,
    @Param('productId') productId: string,
    @Query('sku') sku: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    const targetSku = sku || dto.sku;
    return this.cartService.updateItem(userId, productId, targetSku, dto);
  }

  @Delete('items/:productId')
  async removeItem(
    @CurrentUser('id') userId: string,
    @Param('productId') productId: string,
    @Query('sku') sku: string,
  ) {
    return this.cartService.removeItem(userId, productId, sku);
  }

  @Delete()
  async clearCart(@CurrentUser('id') userId: string) {
    return this.cartService.clearCart(userId);
  }

  @Post('merge')
  async mergeCart(@CurrentUser('id') userId: string, @Body() dto: MergeCartDto) {
    return this.cartService.mergeCart(userId, dto.items);
  }
}
