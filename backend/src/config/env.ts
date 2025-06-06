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
  DATABASE_URL: z.string().url().optional(),
  
  // Redis - Opcional (para cache, não mais necessário para filas)
  REDIS_URL: z.string().optional(),
  
  // Email (Resend)
  RESEND_API_KEY: z.string().default('re_placeholder_for_build'),
  RESEND_DOMAIN: z.string().default('inboxrecovery.com'),
  RESEND_FROM_EMAIL: z.string().email().default('recovery@inboxrecovery.com'),
  RESEND_FROM_NAME: z.string().default('InboxRecovery'),
  RESEND_WEBHOOK_SECRET: z.string().optional(),
  
  // Security
  JWT_SECRET: z.string().min(8).default('dev-secret-key'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // n8n
  N8N_URL: z.string().url().optional(),
  N8N_API_KEY: z.string().optional(),

  // Trigger.dev
  TRIGGER_API_KEY: z.string().optional(),
  TRIGGER_API_URL: z.string().url().default('https://api.trigger.dev'),

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

// Type helper
export type Env = typeof env; 