import { z } from 'zod';
import { EventType } from '@prisma/client';
import { emailQueue } from '../config/queue.config';
import { logger } from '../utils/logger';
import type { EmailJobData } from '../types/queue.types';

// Schema específico para SALE_REFUNDED
const saleRefundedSchema = z.object({
  event: z.literal('SALE_REFUNDED'),
  transaction_id: z.string(),
  order_number: z.string(),
  refund_id: z.string(),
  refund_date: z.string(),
  refund_reason: z.string().optional(),
  refund_amount: z.string(),
  refund_method: z.string(),
  estimated_credit_date: z.string().optional(),
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
  payment_original: z.object({
    method: z.string(),
    amount: z.string(),
    date: z.string()
  }).optional(),
  feedback_url: z.string().url().optional(),
  special_offer: z.object({
    discount_code: z.string(),
    discount_percent: z.number(),
    valid_until: z.string()
  }).optional()
});

export type SaleRefundedPayload = z.infer<typeof saleRefundedSchema>;

export async function handleSaleRefunded(
  payload: unknown,
  eventId: string,
  organizationId: string,
  forceImmediate: boolean = false
) {
  // Valida o payload
  const validatedPayload = saleRefundedSchema.parse(payload);
  
  logger.info('Processing SALE_REFUNDED event', {
    eventId,
    organizationId,
    customerEmail: validatedPayload.customer.email,
    refundId: validatedPayload.refund_id,
    refundAmount: validatedPayload.refund_amount
  });

  // Para reembolso, enviamos confirmação com pequeno delay
  const delay = forceImmediate ? 0 : 5000; // 5 segundos
  
  const jobData: EmailJobData = {
    eventId,
    organizationId,
    eventType: EventType.SALE_REFUNDED,
    attemptNumber: 1,
    to: validatedPayload.customer.email,
    customerName: validatedPayload.customer.name,
    payload: validatedPayload
  };

  const jobId = `${eventId}-refund-confirmation`;
  
  await emailQueue.add(
    'send-email',
    jobData,
    {
      delay,
      jobId,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 3000
      },
      priority: 2, // Prioridade média
      removeOnComplete: {
        age: 30 * 24 * 60 * 60, // 30 dias
        count: 1000
      },
      removeOnFail: false
    }
  );

  logger.info('Refund confirmation email job enqueued', {
    jobId,
    eventId,
    eventType: EventType.SALE_REFUNDED,
    delay,
    forceImmediate
  });
}

// Template único para confirmação de reembolso
export const saleRefundedTemplate = 'sale-refunded-confirmation';

// Assunto do email
export const saleRefundedSubject = '💰 {customerName}, seu reembolso foi processado'; 