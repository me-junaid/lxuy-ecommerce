import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port =
    Number(configService.get('PORT')) || Number(process.env.PORT) || 3001;
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
  // Supports CORS_ORIGIN and ALLOWED_ORIGINS (comma-separated list of allowed origins).
  const rawCorsOrigins =
    configService.get<string>('CORS_ORIGIN') ||
    configService.get<string>('ALLOWED_ORIGINS') ||
    process.env.CORS_ORIGIN ||
    process.env.ALLOWED_ORIGINS ||
    '';

  const configuredOrigins = rawCorsOrigins
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const allowedOrigins =
    configuredOrigins.length > 0
      ? configuredOrigins
      : ['http://localhost:3000', 'http://localhost:3002'];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (e.g. Postman, curl, server-to-server calls, health checks).
      if (!origin) {
        callback(null, true);
        return;
      }
      const normalizedOrigin = origin.trim().replace(/\/+$/, '');
      if (allowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
        return;
      }
      // In development, allow localhost ports automatically
      if (
        !isProduction &&
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin)
      ) {
        callback(null, true);
        return;
      }
      // Safely disallow origin without throwing an unhandled exception
      callback(null, false);
    },
    credentials: true, // Required to accept cookies cross-origin.
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

  await app.listen(port, '0.0.0.0');
  console.log(
    `[${nodeEnv.toUpperCase()}] API running → http://localhost:${port}`,
  );
}

void bootstrap();
