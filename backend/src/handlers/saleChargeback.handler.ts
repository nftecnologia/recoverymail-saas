import { z } from 'zod';
import { EventType } from '@prisma/client';
import { emailQueue } from '../config/queue.config';
import { logger } from '../utils/logger';
import type { EmailJobData } from '../types/queue.types';

// Schema específico para SALE_CHARGEBACK
const saleChargebackSchema = z.object({
  event: z.literal('SALE_CHARGEBACK'),
  transaction_id: z.string(),
  order_number: z.string(),
  chargeback_id: z.string(),
  chargeback_date: z.string(),
  chargeback_reason: z.string().optional(),
  amount: z.string(),
  purchase_date: z.string(),
  days_to_resolve: z.number().default(7),
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
  payment_details: z.object({
    method: z.string(),
    card_last_digits: z.string().optional(),
    billing_descriptor: z.string().optional()
  }).optional(),
  resolution_url: z.string().url().optional()
});

export type SaleChargebackPayload = z.infer<typeof saleChargebackSchema>;

export async function handleSaleChargeback(
  payload: unknown,
  eventId: string,
  organizationId: string,
  forceImmediate: boolean = false
) {
  // Valida o payload
  const validatedPayload = saleChargebackSchema.parse(payload);
  
  logger.info('Processing SALE_CHARGEBACK event', {
    eventId,
    organizationId,
    customerEmail: validatedPayload.customer.email,
    chargebackId: validatedPayload.chargeback_id,
    daysToResolve: validatedPayload.days_to_resolve
  });

  // Chargeback é urgente - enviamos imediatamente
  const delay = 0; // Sem delay, é urgente!
  
  const jobData: EmailJobData = {
    eventId,
    organizationId,
    eventType: EventType.SALE_CHARGEBACK,
    attemptNumber: 1,
    to: validatedPayload.customer.email,
    customerName: validatedPayload.customer.name,
    payload: validatedPayload
  };

  const jobId = `${eventId}-urgent-notice`;
  
  await emailQueue.add(
    'send-email',
    jobData,
    {
      delay,
      jobId,
      attempts: 10, // Muitas tentativas pois é crítico
      backoff: {
        type: 'exponential',
        delay: 1000 // Retry rápido
      },
      priority: 0, // Máxima prioridade
      removeOnComplete: {
        age: 30 * 24 * 60 * 60, // 30 dias
        count: 1000
      },
      removeOnFail: false
    }
  );

  logger.info('URGENT chargeback email job enqueued', {
    jobId,
    eventId,
    eventType: EventType.SALE_CHARGEBACK,
    priority: 'URGENT'
  });

  // Opcionalmente, poderíamos enviar notificações adicionais (SMS, Push, etc.)
  logger.warn('Chargeback received - consider additional notification channels', {
    eventId,
    customerPhone: validatedPayload.customer.phone_number
  });
}

// Template único para notificação de chargeback
export const saleChargebackTemplate = 'sale-chargeback-notice';

// Assunto do email - URGENTE
export const saleChargebackSubject = '⚠️ {customerName}, precisamos resolver uma contestação urgente'; 