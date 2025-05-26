import { z } from 'zod';
import { emailQueue } from '../services/queue.service';
import { logger } from '../utils/logger';
import type { EmailJobData } from '../services/queue.service';

// Schema específico para SALE_REFUSED
const saleRefusedSchema = z.object({
  event: z.literal('SALE_REFUSED'),
  transaction_id: z.string(),
  order_number: z.string(),
  payment_method: z.string(),
  refusal_reason: z.string().optional(),
  refusal_code: z.string().optional(),
  amount: z.string(),
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
  checkout_url: z.string().url(),
  utm: z.object({
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().optional(),
    utm_content: z.string().optional()
  }).optional()
});

export type SaleRefusedPayload = z.infer<typeof saleRefusedSchema>;

export async function handleSaleRefused(
  payload: unknown,
  eventId: string,
  organizationId: string,
  forceImmediate: boolean = false
) {
  // Valida o payload
  const validatedPayload = saleRefusedSchema.parse(payload);
  
  logger.info('Processing SALE_REFUSED event', {
    eventId,
    organizationId,
    customerEmail: validatedPayload.customer.email,
    refusalReason: validatedPayload.refusal_reason
  });

  // Configuração dos delays para cada tentativa
  const delays = [
    30 * 60 * 1000,        // 30 minutos - Primeira tentativa rápida
    6 * 60 * 60 * 1000,    // 6 horas - Segunda tentativa com suporte
  ];

  // Agenda emails para cada tentativa
  for (let i = 0; i < delays.length; i++) {
    const attemptNumber = i + 1;
    const delay = forceImmediate ? 0 : delays[i];
    
    const jobData: EmailJobData = {
      eventId,
      organizationId,
      eventType: 'SALE_REFUSED',
      attemptNumber,
      payload: validatedPayload as any
    };

    const jobId = `${eventId}-attempt-${attemptNumber}`;
    
    await emailQueue.add(
      'send-email',
      jobData,
      {
        delay: delay || 0,
        jobId,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        removeOnComplete: {
          age: 24 * 60 * 60, // 24 horas
          count: 100
        },
        removeOnFail: false
      }
    );

    logger.info('Sale refused email job enqueued', {
      jobId,
      eventId,
      eventType: 'SALE_REFUSED',
      attemptNumber,
      delay,
      forceImmediate
    });
  }
}

// Mapeamento de templates para cada tentativa
export const saleRefusedTemplates = {
  1: 'sale-refused-retry',          // Primeira tentativa - Soluções rápidas
  2: 'sale-refused-support'         // Segunda tentativa - Suporte personalizado
};

// Mapeamento de assuntos para cada tentativa
export const saleRefusedSubjects = {
  1: '❌ {customerName}, houve um problema com seu pagamento',
  2: '💳 {customerName}, ainda está com problemas no pagamento?'
}; 