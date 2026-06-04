const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config();

const envSchema = z.zodSchema ? z.zodSchema : z.object({
  PORT: z.string().transform(Number).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.string().transform(Number).default('5432'),
  DB_USER: z.string().default('syncbeats'),
  DB_PASSWORD: z.string().default('syncbeats'),
  DB_NAME: z.string().default('syncbeats'),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),
  JWT_ACCESS_SECRET: z.string().default('supersecretaccesskeychangeinprod123!'),
  JWT_REFRESH_SECRET: z.string().default('supersecretrefreshkeychangeinprod456!'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

module.exports = parsed.data;
