import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BrandsModule } from './modules/brands/brands.module';
import { ProductsModule } from './modules/products/products.module';
import { CartModule } from './modules/cart/cart.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env', '../../.env'],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),
    // ─── Rate Limiting ───────────────────────────────────────────────────────
    // Global default: 100 requests per 60 seconds per IP.
    // Auth endpoints override this with stricter limits via @Throttle().
    ThrottlerModule.forRoot([
      {
        ttl: 60000,  // Window: 60 seconds
        limit: 100,  // Default: 100 requests per window
      },
    ]),
    UsersModule,
    AuthModule,
    CategoriesModule,
    BrandsModule,
    ProductsModule,
    CartModule,
    WishlistModule,
  ],
  providers: [
    // Apply ThrottlerGuard globally so every route is rate-limited by default.
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
