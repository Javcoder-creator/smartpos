import dotenv from 'dotenv';
dotenv.config();
import { z } from 'zod';

// Resolve DATABASE_URL from either direct URL or component variables
const resolvedDatabaseUrl =
  process.env.DATABASE_URL ||
  (process.env.DB_HOST
    ? `postgres://${encodeURIComponent(process.env.DB_USER || 'postgres')}:${encodeURIComponent(
        process.env.DB_PASSWORD || ''
      )}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'smartpos'}`
    : undefined);

// Resolve JWT Access Secret (support both JWT_ACCESS_SECRET and JWT_SECRET)
const resolvedJwtAccessSecret =
  process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL or (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME) is required'),
  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET (or JWT_SECRET) is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),
  CLICK_SECRET_KEY: z.string().default('click_test_secret'),
  PAYME_KEY: z.string().default('payme_test_secret'),
});

const parsed = envSchema.safeParse({
  ...process.env,
  DATABASE_URL: resolvedDatabaseUrl,
  JWT_ACCESS_SECRET: resolvedJwtAccessSecret,
});

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
