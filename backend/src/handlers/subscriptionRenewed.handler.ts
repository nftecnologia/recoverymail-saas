import { z } from 'zod';
import { EventType } from '@prisma/client';
import { emailQueue } from '../config/queue.config';
import { logger } from '../utils/logger';
import type { EmailJobData } from '../types/queue.types';

// Schema específico para SUBSCRIPTION_RENEWED
const subscriptionRenewedSchema = z.object({
  event: z.literal('SUBSCRIPTION_RENEWED'),
  subscription_id: z.string(),
  renewal_id: z.string(),
  renewal_date: z.string(),
  next_renewal_date: z.string(),
  plan: z.object({
    id: z.string(),
    name: z.string(),
    billing_period: z.enum(['monthly', 'quarterly', 'yearly']),
    amount: z.string()
  }),
  customer: z.object({
    name: z.string(),
    email: z.string().email(),
    phone_number: z.string().optional(),
    document: z.string().optional(),
    member_since: z.string().optional()
  }),
  product: z.object({
    id: z.string(),
    name: z.string(),
    platform_url: z.string().url()
  }),
  stats: z.object({
    completed_lessons: z.number().optional(),
    certificates_earned: z.number().optional(),
    hours_watched: z.number().optional(),
    membership_months: z.number().optional()
  }).optional(),
  benefits: z.object({
    monthly_updates: z.array(z.string()).optional(),
    loyalty_discount: z.object({
      percent: z.number(),
      months: z.number()
    }).optional(),
    exclusive_bonus: z.object({
      name: z.string(),
      description: z.string()
    }).optional()
  }).optional(),
  community: z.object({
    discord_url: z.string().url().optional(),
    telegram_url: z.string().url().optional(),
    facebook_group_url: z.string().url().optional(),
    members_count: z.number().optional()
  }).optional()
});

export type SubscriptionRenewedPayload = z.infer<typeof subscriptionRenewedSchema>;

export async function handleSubscriptionRenewed(
  payload: unknown,
  eventId: string,
  organizationId: string,
  forceImmediate: boolean = false
) {
  // Valida o payload
  const validatedPayload = subscriptionRenewedSchema.parse(payload);
  
  logger.info('Processing SUBSCRIPTION_RENEWED event', {
    eventId,
    organizationId,
    customerEmail: validatedPayload.customer.email,
    subscriptionId: validatedPayload.subscription_id,
    planName: validatedPayload.plan.name
  });

  // Para renovação, enviamos confirmação com pequeno delay
  const delay = forceImmediate ? 0 : 2000; // 2 segundos
  
  const jobData: EmailJobData = {
    eventId,
    organizationId,
    eventType: EventType.SUBSCRIPTION_RENEWED,
    attemptNumber: 1,
    to: validatedPayload.customer.email,
    customerName: validatedPayload.customer.name,
    payload: validatedPayload
  };

  const jobId = `${eventId}-renewal-confirmation`;
  
  await emailQueue.add(
    'send-email',
    jobData,
    {
      delay,
      jobId,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      priority: 1, // Alta prioridade
      removeOnComplete: {
        age: 30 * 24 * 60 * 60, // 30 dias
        count: 1000
      },
      removeOnFail: false
    }
  );

  logger.info('Renewal confirmation email job enqueued', {
    jobId,
    eventId,
    eventType: EventType.SUBSCRIPTION_RENEWED,
    delay,
    forceImmediate
  });
}

// Template único para confirmação de renovação
export const subscriptionRenewedTemplate = 'subscription-renewed-confirmation';

// Assunto do email
export const subscriptionRenewedSubject = '✅ {customerName}, sua assinatura foi renovada com sucesso!'; 