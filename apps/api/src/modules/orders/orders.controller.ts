import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  UpdateFulfillmentStatusDto,
  AddOrderNoteDto,
  CancelOrderDto,
  AdminListOrdersQueryDto,
} from './order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/v1/orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ─── Storefront ────────────────────────────────────────────────────────────

  @Post()
  async createOrder(
    @CurrentUser('id') userId: string,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(userId, createOrderDto);
  }

  @Get()
  async getUserOrders(@CurrentUser('id') userId: string) {
    return this.ordersService.getUserOrders(userId);
  }

  @Get('my')
  async getUserOrdersMy(@CurrentUser('id') userId: string) {
    return this.ordersService.getUserOrders(userId);
  }

  @Get('my/:id')
  async getOrderDetails(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Param('id') orderId: string,
  ) {
    return this.ordersService.getOrderDetails(userId, orderId, userRole);
  }

  // ─── Admin ─────────────────────────────────────────────────────────────────

  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles('admin', 'store_manager')
  async getStats() {
    return this.ordersService.getStats();
  }

  @Get('admin/export')
  @UseGuards(RolesGuard)
  @Roles('admin', 'store_manager')
  async exportCsv(
    @Query() query: AdminListOrdersQueryDto,
    @Res() res: Response,
  ) {
    const csv = await this.ordersService.exportCsv(query);
    const filename = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('admin', 'store_manager')
  async findAllAdmin(@Query() query: AdminListOrdersQueryDto) {
    return this.ordersService.findAllAdmin(query);
  }

  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'store_manager')
  async findOneAdmin(@Param('id') orderId: string) {
    return this.ordersService.findOneAdmin(orderId);
  }

  @Patch('admin/:id/status')
  @UseGuards(RolesGuard)
  @Roles('admin', 'store_manager')
  async updateStatus(
    @Param('id') orderId: string,
    @Body() dto: UpdateFulfillmentStatusDto,
    @CurrentUser('email') adminEmail: string,
  ) {
    return this.ordersService.updateFulfillmentStatus(orderId, dto, adminEmail);
  }

  @Post('admin/:id/notes')
  @UseGuards(RolesGuard)
  @Roles('admin', 'store_manager')
  async addNote(
    @Param('id') orderId: string,
    @Body() dto: AddOrderNoteDto,
    @CurrentUser('email') adminEmail: string,
  ) {
    return this.ordersService.addNote(orderId, dto, adminEmail);
  }

  @Post('admin/:id/cancel')
  @UseGuards(RolesGuard)
  @Roles('admin', 'store_manager')
  async cancelOrder(
    @Param('id') orderId: string,
    @Body() dto: CancelOrderDto,
    @CurrentUser('email') adminEmail: string,
  ) {
    return this.ordersService.cancelOrder(orderId, dto, adminEmail);
  }

  // Keep old /:id route for backward compatibility with existing storefront code
  @Get(':id')
  async getOrderDetailsLegacy(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Param('id') orderId: string,
  ) {
    return this.ordersService.getOrderDetails(userId, orderId, userRole);
  }
}
