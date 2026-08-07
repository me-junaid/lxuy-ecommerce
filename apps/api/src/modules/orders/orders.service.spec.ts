import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { OrdersService } from './orders.service';
import { Order } from './order.schema';
import { CartService } from '../cart/cart.service';
import { ProductsService } from '../products/products.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('OrdersService', () => {
  let ordersService: OrdersService;
  let cartService: jest.Mocked<CartService>;
  let productsService: jest.Mocked<ProductsService>;
  let mockOrderModel: any;

  const mockUserId = '60d0fe4f5311236168a109ca';
  const mockCartId = '60d0fe4f5311236168a109cb';
  const mockProductId = '60d0fe4f5311236168a109cc';
  const mockOrderId = '60d0fe4f5311236168a109cd';

  const mockCart = {
    _id: mockCartId,
    user: mockUserId,
    items: [
      {
        product: { _id: mockProductId },
        sku: 'SKU-COAT-M',
        quantity: 2,
      },
    ],
  };

  const mockProduct = {
    _id: mockProductId,
    name: 'Classic Trench',
    variants: [
      {
        sku: 'SKU-COAT-M',
        price: 1000,
        stock: 5,
        isActive: true,
        attributes: [],
        images: [],
      },
    ],
  };

  beforeEach(async () => {
    mockOrderModel = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue({
        _id: mockOrderId,
        ...data,
      }),
    }));

    // Mock query methods on the model
    mockOrderModel.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      }),
    });
    mockOrderModel.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });

    const mockCartService = {
      getCart: jest.fn().mockResolvedValue(mockCart),
      clearCart: jest.fn().mockResolvedValue(mockCart),
    };

    const mockProductsService = {
      findById: jest.fn().mockResolvedValue(mockProduct),
      decrementStock: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getModelToken(Order.name), useValue: mockOrderModel },
        { provide: CartService, useValue: mockCartService },
        { provide: ProductsService, useValue: mockProductsService },
      ],
    }).compile();

    ordersService = module.get<OrdersService>(OrdersService);
    cartService = module.get(CartService);
    productsService = module.get(ProductsService);
  });

  it('should be defined', () => {
    expect(ordersService).toBeDefined();
  });

  describe('createOrder', () => {
    it('should throw BadRequestException if cart is empty', async () => {
      cartService.getCart.mockResolvedValueOnce({ _id: mockCartId, user: mockUserId, items: [] } as any);

      await expect(
        ordersService.createOrder(mockUserId, {
          shippingAddress: {
            email: 'test@example.com',
            phone: '9876543210',
            firstName: 'John',
            lastName: 'Doe',
            street: '123 street',
            city: 'Mumbai',
            state: 'Maharashtra',
            zip: '400001',
            country: 'India',
          },
          paymentMethod: 'card',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if variant SKU is missing', async () => {
      // Product without matching SKU
      productsService.findById.mockResolvedValueOnce({
        _id: mockProductId,
        name: 'Classic Trench',
        variants: [],
      } as any);

      await expect(
        ordersService.createOrder(mockUserId, {
          shippingAddress: {
            email: 'test@example.com',
            phone: '9876543210',
            firstName: 'John',
            lastName: 'Doe',
            street: '123 street',
            city: 'Mumbai',
            state: 'Maharashtra',
            zip: '400001',
            country: 'India',
          },
          paymentMethod: 'card',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if stock is insufficient', async () => {
      // Product variant with only 1 stock (cart wants 2)
      productsService.findById.mockResolvedValueOnce({
        _id: mockProductId,
        name: 'Classic Trench',
        variants: [
          {
            sku: 'SKU-COAT-M',
            price: 1000,
            stock: 1,
            isActive: true,
          },
        ],
      } as any);

      await expect(
        ordersService.createOrder(mockUserId, {
          shippingAddress: {
            email: 'test@example.com',
            phone: '9876543210',
            firstName: 'John',
            lastName: 'Doe',
            street: '123 street',
            city: 'Mumbai',
            state: 'Maharashtra',
            zip: '400001',
            country: 'India',
          },
          paymentMethod: 'card',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully place order, deduct stock, and clear cart', async () => {
      const orderDto = {
        shippingAddress: {
          email: 'test@example.com',
          phone: '9876543210',
          firstName: 'John',
          lastName: 'Doe',
          street: '123 street',
          city: 'Mumbai',
          state: 'Maharashtra',
          zip: '400001',
          country: 'India',
        },
        paymentMethod: 'card',
        couponCode: 'LUXURY20',
      };

      const result = await ordersService.createOrder(mockUserId, orderDto);

      expect(result).toBeDefined();
      expect(productsService.decrementStock).toHaveBeenCalledWith(mockProductId, 'SKU-COAT-M', 2);
      expect(cartService.clearCart).toHaveBeenCalledWith(mockUserId);
      expect(result.pricing.subtotal).toBe(2000); // 1000 * 2
      expect(result.pricing.discount).toBe(400); // 20% of 2000
    });
  });

  describe('getOrderDetails', () => {
    it('should throw NotFoundException if order is not found', async () => {
      await expect(ordersService.getOrderDetails(mockUserId, '60d0fe4f5311236168a109cb')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if order belongs to another user and requester is a customer', async () => {
      const anotherUserOrder = {
        _id: mockOrderId,
        user: '60d0fe4f5311236168a109cf',
      };
      mockOrderModel.findById.mockReturnValueOnce({
        populate: jest.fn().mockReturnValueOnce({
          exec: jest.fn().mockResolvedValueOnce(anotherUserOrder),
        }),
      });

      await expect(
        ordersService.getOrderDetails(mockUserId, '60d0fe4f5311236168a109cb', 'customer'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return order details if user is the owner', async () => {
      const ownedOrder = {
        _id: mockOrderId,
        user: mockUserId,
      };
      mockOrderModel.findById.mockReturnValueOnce({
        populate: jest.fn().mockReturnValueOnce({
          exec: jest.fn().mockResolvedValueOnce(ownedOrder),
        }),
      });

      const result = await ordersService.getOrderDetails(mockUserId, '60d0fe4f5311236168a109cb', 'customer');
      expect(result).toEqual(ownedOrder);
    });

    it('should return order details if requester is admin even if they do not own the order', async () => {
      const anotherUserOrder = {
        _id: mockOrderId,
        user: '60d0fe4f5311236168a109cf',
      };
      mockOrderModel.findById.mockReturnValueOnce({
        populate: jest.fn().mockReturnValueOnce({
          exec: jest.fn().mockResolvedValueOnce(anotherUserOrder),
        }),
      });

      const result = await ordersService.getOrderDetails(mockUserId, '60d0fe4f5311236168a109cb', 'admin');
      expect(result).toEqual(anotherUserOrder);
    });
  });
});
