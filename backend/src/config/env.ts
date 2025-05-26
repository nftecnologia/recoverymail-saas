import dotenv from 'dotenv';
import { z } from 'zod';

// Carregar variáveis de ambiente
dotenv.config();

// Schema de validação
const envSchema = z.object({
  // Node
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Server
  PORT: z.string().default('4000').transform(Number),
  API_URL: z.string().url().default('http://localhost:4000'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  
  // Database
  DATABASE_URL: z.string().url(),
  
  // Redis - Suporta tanto Redis local quanto Upstash
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform(Number),
  REDIS_PASSWORD: z.string().optional(),
  
  // Upstash Redis (opcional)
  KV_URL: z.string().optional(),
  KV_REST_API_URL: z.string().optional(),
  KV_REST_API_TOKEN: z.string().optional(),
  
  // Email (Resend)
  RESEND_API_KEY: z.string(),
  RESEND_DOMAIN: z.string().default('inboxrecovery.com'),
  RESEND_FROM_EMAIL: z.string().email().default('recovery@inboxrecovery.com'),
  RESEND_FROM_NAME: z.string().default('InboxRecovery'),
  RESEND_WEBHOOK_SECRET: z.string().optional(),
  
  // Security
  JWT_SECRET: z.string().min(32),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // n8n
  N8N_URL: z.string().url().optional(),
  N8N_API_KEY: z.string().optional(),

  // Optional services
  SENTRY_DSN: z.string().url().optional(),
  OPENAI_API_KEY: z.string().optional(),
});

// Validar e exportar
const envResult = envSchema.safeParse(process.env);

if (!envResult.success) {
  console.error('❌ Invalid environment variables:');
  console.error(envResult.error.format());
  process.exit(1);
}

export const env = envResult.data;

// Helper para obter a configuração do Redis
export function getRedisConfig() {
  // Se tiver REDIS_URL (Upstash ou Redis completo), usar ela
  if (env.REDIS_URL) {
    return env.REDIS_URL;
  }
  
  // Caso contrário, montar a URL do Redis local
  const auth = env.REDIS_PASSWORD ? `:${env.REDIS_PASSWORD}@` : '';
  return `redis://${auth}${env.REDIS_HOST}:${env.REDIS_PORT}`;
}

// Type helper
export type Env = typeof env; 