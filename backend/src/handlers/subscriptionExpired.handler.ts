import { z } from 'zod';
import { emailQueue } from '../services/queue.service';
import { logger } from '../utils/logger';
import type { EmailJobData } from '../services/queue.service';

// Schema específico para SUBSCRIPTION_EXPIRED
const subscriptionExpiredSchema = z.object({
  event: z.literal('SUBSCRIPTION_EXPIRED'),
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
    last_payment_date: z.string().optional(),
    total_paid: z.string().optional(),
    usage_stats: z.object({
      total_logins: z.number().optional(),
      content_accessed: z.number().optional(),
      completion_rate: z.string().optional()
    }).optional()
  }),
  expiration: z.object({
    expired_at: z.string(),
    reason: z.enum(['PAYMENT_FAILED', 'CARD_EXPIRED', 'INSUFFICIENT_FUNDS', 'CANCELED', 'OTHER']).optional(),
    grace_period_until: z.string().optional(), // Período de graça
    failed_attempts: z.number().optional()
  }),
  renewal_offer: z.object({
    discount_percent: z.number().optional(),
    discount_amount: z.string().optional(),
    valid_until: z.string().optional(),
    payment_link: z.string().url().optional(),
    alternative_plans: z.array(z.object({
      id: z.string(),
      name: z.string(),
      price: z.string(),
      discount: z.string().optional()
    })).optional()
  }).optional(),
  content_backup: z.object({
    download_link: z.string().url().optional(),
    available_until: z.string().optional(),
    content_list: z.array(z.string()).optional()
  }).optional(),
  checkout_url: z.string().url().optional(),
  utm: z.object({
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().optional(),
    utm_content: z.string().optional()
  }).optional()
});

export type SubscriptionExpiredPayload = z.infer<typeof subscriptionExpiredSchema>;

export async function handleSubscriptionExpired(
  payload: unknown,
  eventId: string,
  organizationId: string,
  forceImmediate: boolean = false
) {
  // Valida o payload
  const validatedPayload = subscriptionExpiredSchema.parse(payload);
  
  logger.info('Processing SUBSCRIPTION_EXPIRED event', {
    eventId,
    organizationId,
    customerEmail: validatedPayload.customer.email,
    subscriptionId: validatedPayload.subscription_id,
    expirationReason: validatedPayload.expiration.reason
  });

  // Configuração dos delays para cada tentativa
  const delays = [
    0,                         // Imediato - Notificação de expiração
    3 * 24 * 60 * 60 * 1000,   // 3 dias - Oferta de renovação
    7 * 24 * 60 * 60 * 1000,   // 7 dias - Última chance antes da perda completa
  ];

  // Agenda emails para cada tentativa
  for (let i = 0; i < delays.length; i++) {
    const attemptNumber = i + 1;
    const delay = forceImmediate ? 0 : delays[i];
    
    const jobData: EmailJobData = {
      eventId,
      organizationId,
      eventType: 'SUBSCRIPTION_EXPIRED',
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

    logger.info('Subscription expired email job enqueued', {
      jobId,
      eventId,
      eventType: 'SUBSCRIPTION_EXPIRED',
      attemptNumber,
      delay,
      forceImmediate
    });
  }
}

// Mapeamento de templates para cada tentativa
export const subscriptionExpiredTemplates = {
  1: 'subscription-expired-notification',   // Notificação da expiração
  2: 'subscription-expired-renewal',        // Oferta de renovação
  3: 'subscription-expired-lastchance'      // Última chance antes da perda
};

// Mapeamento de assuntos para cada tentativa
export const subscriptionExpiredSubjects = {
  1: '⚠️ {customerName}, sua assinatura expirou - Renovar agora',
  2: '💡 {customerName}, oferta especial para renovar sua assinatura',
  3: '🚨 {customerName}, ÚLTIMA CHANCE: Seus dados serão excluídos em breve'
};

// Função de processamento para o worker
export async function processSubscriptionExpired(job: any): Promise<void> {
  const { eventId, attemptNumber, payload } = job.data;
  
  try {
    const validatedPayload = subscriptionExpiredSchema.parse(payload);
    
    logger.info('Processing SUBSCRIPTION_EXPIRED email', {
      eventId,
      attemptNumber,
      customerEmail: validatedPayload.customer.email
    });

    // Importar serviço de email dinamicamente para evitar circular imports
    const { sendEmail } = await import('../services/email.service');
    
    // Preparar dados do email
    const template = subscriptionExpiredTemplates[attemptNumber as keyof typeof subscriptionExpiredTemplates];
    const subjectTemplate = subscriptionExpiredSubjects[attemptNumber as keyof typeof subscriptionExpiredSubjects];
    
    const emailData = {
      to: validatedPayload.customer.email,
      subject: subjectTemplate.replace('{customerName}', validatedPayload.customer.name),
      template,
      data: {
        customerName: validatedPayload.customer.name,
        subscriptionId: validatedPayload.subscription_id,
        subscriptionPlan: validatedPayload.subscription_plan,
        expiration: validatedPayload.expiration,
        renewalOffer: validatedPayload.renewal_offer,
        contentBackup: validatedPayload.content_backup,
        checkoutUrl: validatedPayload.checkout_url,
        utm: validatedPayload.utm,
        // Dados específicos por tentativa
        isNotification: attemptNumber === 1,
        isRenewalOffer: attemptNumber === 2,
        isLastChance: attemptNumber === 3
      },
      organizationId: job.data.organizationId,
      eventId,
      attemptNumber
    };

    await sendEmail(emailData);
    
    logger.info('SUBSCRIPTION_EXPIRED email sent successfully', {
      eventId,
      attemptNumber,
      template
    });
    
  } catch (error) {
    logger.error('Error processing SUBSCRIPTION_EXPIRED email', {
      eventId,
      attemptNumber,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}