import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3001;
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
  const isProduction = nodeEnv === 'production';

  // ─── Cookie Parser ────────────────────────────────────────────────────────
  app.use(cookieParser());


  // ─── Security Headers (Helmet) ────────────────────────────────────────────
  // Helmet sets a suite of HTTP response headers that protect against common
  // web vulnerabilities: XSS, clickjacking, MIME-sniffing, etc.
  app.use(
    helmet({
      // Only enforce Strict-Transport-Security (HTTPS) in production.
      hsts: isProduction,
      // Content-Security-Policy is intentionally relaxed in development so
      // hot-reload and DevTools work without errors.
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'https:'],
              connectSrc: ["'self'"],
              fontSrc: ["'self'"],
              objectSrc: ["'none'"],
              frameSrc: ["'none'"],
              upgradeInsecureRequests: isProduction ? [] : null,
            },
          }
        : false,
      crossOriginEmbedderPolicy: isProduction,
    }),
  );

  // ─── CORS ─────────────────────────────────────────────────────────────────
  // Only allow requests from the Next.js frontend. Expand this list when
  // deploying to production (add your production domain).
  const allowedOrigins = isProduction
    ? (configService.get<string>('ALLOWED_ORIGINS') || '').split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://localhost:3002'];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. Postman, server-to-server calls).
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    },
    credentials: true,          // Required to accept cookies cross-origin.
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });


  // ─── Global Validation ────────────────────────────────────────────────────
  // whitelist:            Strip properties not present in the DTO class.
  // forbidNonWhitelisted: Reject requests that contain extra properties.
  // transform:            Auto-coerce payload types (string → number, etc.).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(port);
  console.log(
    `[${nodeEnv.toUpperCase()}] API running → http://localhost:${port}`,
  );
}

bootstrap();
