import { z } from 'zod';
import { logger } from '../utils/logger';

// Schema específico para SUBSCRIPTION_CANCELED
const subscriptionCanceledSchema = z.object({
  event: z.literal('SUBSCRIPTION_CANCELED'),
  subscription_id: z.string(),
  customer_id: z.string().optional(),
  subscription_plan: z.object({
    id: z.string(),
    name: z.string(),
    price: z.string(),
    billing_cycle: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
    description: z.string().optional()
  }),
  customer: z.object({
    name: z.string(),
    email: z.string().email(),
    phone_number: z.string().optional(),
    document: z.string().optional(),
    subscription_start_date: z.string().optional(),
    total_paid: z.string().optional()
  }),
  cancellation: z.object({
    reason: z.string().optional(),
    canceled_at: z.string(),
    canceled_by: z.enum(['CUSTOMER', 'ADMIN', 'SYSTEM']).optional(),
    effective_until: z.string().optional(), // Data até quando ainda tem acesso
    refund_amount: z.string().optional()
  }),
  benefits_lost: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    value_estimate: z.string().optional()
  })).optional(),
  win_back_offer: z.object({
    discount_percent: z.number().optional(),
    discount_amount: z.string().optional(),
    valid_until: z.string().optional(),
    special_terms: z.string().optional()
  }).optional(),
  checkout_url: z.string().url().optional(),
  utm: z.object({
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().optional(),
    utm_content: z.string().optional()
  }).optional()
});

export type SubscriptionCanceledPayload = z.infer<typeof subscriptionCanceledSchema>;

export async function handleSubscriptionCanceled(
  payload: unknown,
  eventId: string,
  organizationId: string,
  forceImmediate: boolean = false
) {
  // Valida o payload
  const validatedPayload = subscriptionCanceledSchema.parse(payload);
  
  logger.info('Processing SUBSCRIPTION_CANCELED event', {
    eventId,
    organizationId,
    customerEmail: validatedPayload.customer.email,
    subscriptionId: validatedPayload.subscription_id,
    cancellationReason: validatedPayload.cancellation.reason
  });

  // Configuração dos delays para cada tentativa
  const delays = [
    0,                         // Imediato - Confirmação e feedback
    7 * 24 * 60 * 60 * 1000,   // 7 dias - Win-back com oferta especial
    30 * 24 * 60 * 60 * 1000,  // 30 dias - Última tentativa com desconto
  ];

  // Agenda emails para cada tentativa
  for (let i = 0; i < delays.length; i++) {
    const attemptNumber = i + 1;
    const delay = forceImmediate ? 0 : delays[i];
    

    const jobId = `${eventId}-attempt-${attemptNumber}`;
    

    logger.info('Subscription canceled email job enqueued', {
      jobId,
      eventId,
      eventType: 'SUBSCRIPTION_CANCELED',
      attemptNumber,
      delay,
      forceImmediate
    });
  }
}

// Mapeamento de templates para cada tentativa
export const subscriptionCanceledTemplates = {
  1: 'subscription-canceled-confirmation',  // Confirmação e feedback
  2: 'subscription-canceled-winback',       // Win-back com oferta especial
  3: 'subscription-canceled-lastchance'     // Última tentativa com desconto máximo
};

// Mapeamento de assuntos para cada tentativa
export const subscriptionCanceledSubjects = {
  1: '✅ {customerName}, sua assinatura foi cancelada - Queremos seu feedback',
  2: '💔 {customerName}, sentimos sua falta! Oferta especial para voltar',
  3: '🎁 {customerName}, última chance: 50% OFF para reativar sua assinatura'
};

// Função de processamento para o worker
export async function processSubscriptionCanceled(job: any): Promise<void> {
  const { eventId, attemptNumber, payload } = job.data;
  
  try {
    const validatedPayload = subscriptionCanceledSchema.parse(payload);
    
    logger.info('Processing SUBSCRIPTION_CANCELED email', {
      eventId,
      attemptNumber,
      customerEmail: validatedPayload.customer.email
    });

    // Importar serviço de email dinamicamente para evitar circular imports
    const { sendEmail } = await import('../services/email.service');
    
    // Preparar dados do email
    const template = subscriptionCanceledTemplates[attemptNumber as keyof typeof subscriptionCanceledTemplates];
    const subjectTemplate = subscriptionCanceledSubjects[attemptNumber as keyof typeof subscriptionCanceledSubjects];
    
    const emailData = {
      to: validatedPayload.customer.email,
      subject: subjectTemplate.replace('{customerName}', validatedPayload.customer.name),
      template,
      data: {
        customerName: validatedPayload.customer.name,
        subscriptionId: validatedPayload.subscription_id,
        subscriptionPlan: validatedPayload.subscription_plan,
        cancellation: validatedPayload.cancellation,
        benefitsLost: validatedPayload.benefits_lost,
        winBackOffer: validatedPayload.win_back_offer,
        checkoutUrl: validatedPayload.checkout_url,
        utm: validatedPayload.utm,
        // Dados específicos por tentativa
        isConfirmation: attemptNumber === 1,
        isWinBack: attemptNumber === 2,
        isLastChance: attemptNumber === 3
      },
      organizationId: job.data.organizationId,
      eventId,
      attemptNumber
    };

    await sendEmail(emailData);
    
    logger.info('SUBSCRIPTION_CANCELED email sent successfully', {
      eventId,
      attemptNumber,
      template
    });
    
  } catch (error) {
    logger.error('Error processing SUBSCRIPTION_CANCELED email', {
      eventId,
      attemptNumber,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}