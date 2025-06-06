import { z } from 'zod';
import { logger } from '../utils/logger';

// Schema específico para PIX_GENERATED
const pixGeneratedSchema = z.object({
  event: z.literal('PIX_GENERATED'),
  transaction_id: z.string(),
  order_number: z.string().optional(),
  pix_qr_code: z.string(), // Base64 da imagem QR Code
  pix_copy_paste: z.string(), // Código PIX para copiar e colar
  total_price: z.string(),
  expires_at: z.string(), // Data de expiração do PIX
  customer: z.object({
    name: z.string(),
    email: z.string().email(),
    phone_number: z.string().optional(),
    document: z.string().optional()
  }),
  products: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    price: z.string(),
    quantity: z.number().optional(),
    offer_name: z.string().optional(),
    description: z.string().optional()
  })).optional(),
  payment_details: z.object({
    method: z.literal('PIX'),
    expires_in_minutes: z.number().optional().default(30)
  }).optional(),
  checkout_url: z.string().url().optional(),
  utm: z.object({
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().optional(),
    utm_content: z.string().optional()
  }).optional()
});

export type PixGeneratedPayload = z.infer<typeof pixGeneratedSchema>;

export async function handlePixGenerated(
  payload: unknown,
  eventId: string,
  organizationId: string,
  forceImmediate: boolean = false
) {
  // Valida o payload
  const validatedPayload = pixGeneratedSchema.parse(payload);
  
  logger.info('Processing PIX_GENERATED event', {
    eventId,
    organizationId,
    customerEmail: validatedPayload.customer.email,
    transactionId: validatedPayload.transaction_id,
    expiresAt: validatedPayload.expires_at
  });

  // Configuração dos delays para cada tentativa
  const delays = [
    1 * 60 * 1000,         // 1 minuto - QR Code imediato
    10 * 60 * 1000,        // 10 minutos - Lembrete urgente
    25 * 60 * 1000,        // 25 minutos - Últimos minutos
  ];

  // Agenda emails para cada tentativa
  for (let i = 0; i < delays.length; i++) {
    const attemptNumber = i + 1;
    const delay = forceImmediate ? 0 : delays[i];
    

    const jobId = `${eventId}-attempt-${attemptNumber}`;
    

    logger.info('PIX generated email job enqueued', {
      jobId,
      eventId,
      eventType: 'PIX_GENERATED',
      attemptNumber,
      delay,
      forceImmediate
    });
  }
}

// Mapeamento de templates para cada tentativa
export const pixGeneratedTemplates = {
  1: 'pix-generated-qrcode',      // QR Code e instruções
  2: 'pix-generated-urgency',     // Lembrete urgente 10min
  3: 'pix-generated-lastchance'   // Últimos 5 minutos
};

// Mapeamento de assuntos para cada tentativa
export const pixGeneratedSubjects = {
  1: '⚡ {customerName}, seu PIX foi gerado - Pagamento em 30 segundos!',
  2: '🚨 {customerName}, seu PIX expira em 20 minutos!',
  3: '⏰ {customerName}, ÚLTIMOS 5 MINUTOS para pagar via PIX!'
};

// Função de processamento para o worker
export async function processPixGenerated(job: any): Promise<void> {
  const { eventId, attemptNumber, payload } = job.data;
  
  try {
    const validatedPayload = pixGeneratedSchema.parse(payload);
    
    logger.info('Processing PIX_GENERATED email', {
      eventId,
      attemptNumber,
      customerEmail: validatedPayload.customer.email
    });

    // Importar serviço de email dinamicamente para evitar circular imports
    const { sendEmail } = await import('../services/email.service');
    
    // Preparar dados do email
    const template = pixGeneratedTemplates[attemptNumber as keyof typeof pixGeneratedTemplates];
    const subjectTemplate = pixGeneratedSubjects[attemptNumber as keyof typeof pixGeneratedSubjects];
    
    const emailData = {
      to: validatedPayload.customer.email,
      subject: subjectTemplate.replace('{customerName}', validatedPayload.customer.name),
      template,
      data: {
        customerName: validatedPayload.customer.name,
        transactionId: validatedPayload.transaction_id,
        orderNumber: validatedPayload.order_number,
        pixQrCode: validatedPayload.pix_qr_code,
        pixCopyPaste: validatedPayload.pix_copy_paste,
        totalPrice: validatedPayload.total_price,
        expiresAt: validatedPayload.expires_at,
        products: validatedPayload.products,
        paymentDetails: validatedPayload.payment_details,
        checkoutUrl: validatedPayload.checkout_url,
        utm: validatedPayload.utm
      },
      organizationId: job.data.organizationId,
      eventId,
      attemptNumber
    };

    await sendEmail(emailData);
    
    logger.info('PIX_GENERATED email sent successfully', {
      eventId,
      attemptNumber,
      template
    });
    
  } catch (error) {
    logger.error('Error processing PIX_GENERATED email', {
      eventId,
      attemptNumber,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}