import { z } from 'zod';
import { logger } from '../utils/logger';

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
    

    const jobId = `${eventId}-attempt-${attemptNumber}`;
    

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

// Função de processamento para o worker
export async function processSaleRefused(job: any): Promise<void> {
  const { eventId, attemptNumber, payload } = job.data;
  
  try {
    const validatedPayload = saleRefusedSchema.parse(payload);
    
    logger.info('Processing SALE_REFUSED email', {
      eventId,
      attemptNumber,
      customerEmail: validatedPayload.customer.email
    });

    // Importar serviço de email dinamicamente para evitar circular imports
    const { sendEmail } = await import('../services/email.service');
    
    // Preparar dados do email
    const template = saleRefusedTemplates[attemptNumber as keyof typeof saleRefusedTemplates];
    const subjectTemplate = saleRefusedSubjects[attemptNumber as keyof typeof saleRefusedSubjects];
    
    const emailData = {
      to: validatedPayload.customer.email,
      subject: subjectTemplate.replace('{customerName}', validatedPayload.customer.name),
      template,
      data: {
        customerName: validatedPayload.customer.name,
        transactionId: validatedPayload.transaction_id,
        orderNumber: validatedPayload.order_number,
        amount: validatedPayload.amount,
        paymentMethod: validatedPayload.payment_method,
        refusalReason: validatedPayload.refusal_reason,
        refusalCode: validatedPayload.refusal_code,
        checkoutUrl: validatedPayload.checkout_url,
        product: validatedPayload.product,
        utm: validatedPayload.utm
      },
      organizationId: job.data.organizationId,
      eventId,
      attemptNumber
    };

    await sendEmail(emailData);
    
    logger.info('SALE_REFUSED email sent successfully', {
      eventId,
      attemptNumber,
      template
    });
    
  } catch (error) {
    logger.error('Error processing SALE_REFUSED email', {
      eventId,
      attemptNumber,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
} 