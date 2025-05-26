import { z } from 'zod';
import { emailQueue } from '../services/queue.service';
import { logger } from '../utils/logger';
import type { EmailJobData } from '../services/queue.service';

// Schema específico para SALE_APPROVED
const saleApprovedSchema = z.object({
  event: z.literal('SALE_APPROVED'),
  transaction_id: z.string(),
  order_number: z.string(),
  payment_method: z.string(),
  amount: z.string(),
  installments: z.number().optional(),
  customer: z.object({
    name: z.string(),
    email: z.string().email(),
    phone_number: z.string().optional(),
    document: z.string().optional()
  }),
  product: z.object({
    id: z.string(),
    name: z.string(),
    offer_id: z.string().optional(),
    offer_name: z.string().optional()
  }),
  access: z.object({
    platform_url: z.string().url(),
    email: z.string().email(),
    password: z.string().optional(),
    temporary_password: z.boolean().optional()
  }).optional(),
  bonuses: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional()
  })).optional(),
  community: z.object({
    discord_url: z.string().url().optional(),
    telegram_url: z.string().url().optional(),
    facebook_group_url: z.string().url().optional(),
    members_count: z.number().optional()
  }).optional()
});

export type SaleApprovedPayload = z.infer<typeof saleApprovedSchema>;

export async function handleSaleApproved(
  payload: unknown,
  eventId: string,
  organizationId: string,
  forceImmediate: boolean = false
) {
  // Valida o payload
  const validatedPayload = saleApprovedSchema.parse(payload);
  
  logger.info('Processing SALE_APPROVED event', {
    eventId,
    organizationId,
    customerEmail: validatedPayload.customer.email,
    orderNumber: validatedPayload.order_number
  });

  // Para venda aprovada, enviamos apenas 1 email de confirmação imediatamente
  const delay = forceImmediate ? 0 : 1000; // 1 segundo de delay apenas para evitar sobrecarga
  
  const jobData: EmailJobData = {
    eventId,
    organizationId,
    eventType: 'SALE_APPROVED',
    attemptNumber: 1,
    payload: validatedPayload as any
  };

  const jobId = `${eventId}-confirmation`;
  
  await emailQueue.add(
    'send-email',
    jobData,
    {
      delay,
      jobId,
      attempts: 5, // Mais tentativas pois é crítico
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      priority: 1, // Alta prioridade
      removeOnComplete: {
        age: 7 * 24 * 60 * 60, // 7 dias
        count: 1000
      },
      removeOnFail: false
    }
  );

  logger.info('Confirmation email job enqueued', {
    jobId,
    eventId,
    eventType: 'SALE_APPROVED',
    delay,
    forceImmediate
  });
}

// Template único para confirmação
export const saleApprovedTemplate = 'sale-approved-confirmation';

// Assunto do email
export const saleApprovedSubject = '✅ Parabéns {customerName}! Seja muito bem-vindo(a)!'; 