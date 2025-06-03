import { z } from 'zod';
import { emailQueue } from '../services/queue.service';
import { logger } from '../utils/logger';
import type { EmailJobData } from '../services/queue.service';

// Schema específico para BANK_SLIP_GENERATED
const bankSlipGeneratedSchema = z.object({
  event: z.literal('BANK_SLIP_GENERATED'),
  transaction_id: z.string(),
  order_number: z.string().optional(),
  bank_slip_url: z.string().url(),
  digitable_line: z.string().optional(),
  barcode: z.string().optional(),
  total_price: z.string(),
  due_date: z.string(), // Data de vencimento
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
  })),
  payment_details: z.object({
    method: z.literal('BANK_SLIP'),
    installments: z.number().optional()
  }).optional(),
  checkout_url: z.string().url().optional(),
  utm: z.object({
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().optional(),
    utm_content: z.string().optional()
  }).optional()
});

export type BankSlipGeneratedPayload = z.infer<typeof bankSlipGeneratedSchema>;

export async function handleBankSlipGenerated(
  payload: unknown,
  eventId: string,
  organizationId: string,
  forceImmediate: boolean = false
) {
  // Valida o payload
  const validatedPayload = bankSlipGeneratedSchema.parse(payload);
  
  logger.info('Processing BANK_SLIP_GENERATED event', {
    eventId,
    organizationId,
    customerEmail: validatedPayload.customer.email,
    transactionId: validatedPayload.transaction_id,
    dueDate: validatedPayload.due_date
  });

  // Configuração dos delays para cada tentativa
  const delays = [
    2 * 60 * 1000,         // 2 minutos - Confirmação imediata
    24 * 60 * 60 * 1000,   // 24 horas - Lembrete do vencimento
    48 * 60 * 60 * 1000,   // 48 horas - Lembrete final antes do vencimento
  ];

  // Agenda emails para cada tentativa
  for (let i = 0; i < delays.length; i++) {
    const attemptNumber = i + 1;
    const delay = forceImmediate ? 0 : delays[i];
    
    const jobData: EmailJobData = {
      eventId,
      organizationId,
      eventType: 'BANK_SLIP_GENERATED',
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

    logger.info('Bank slip generated email job enqueued', {
      jobId,
      eventId,
      eventType: 'BANK_SLIP_GENERATED',
      attemptNumber,
      delay,
      forceImmediate
    });
  }
}

// Mapeamento de templates para cada tentativa
export const bankSlipGeneratedTemplates = {
  1: 'bank-slip-generated-confirmation',  // Confirmação com instruções
  2: 'bank-slip-generated-reminder',      // Lembrete 24h
  3: 'bank-slip-generated-urgency'        // Urgência antes do vencimento
};

// Mapeamento de assuntos para cada tentativa
export const bankSlipGeneratedSubjects = {
  1: '📄 {customerName}, seu boleto foi gerado com sucesso',
  2: '⏰ {customerName}, lembrete: seu boleto vence amanhã',
  3: '🚨 {customerName}, últimas horas para pagar seu boleto'
};

// Função de processamento para o worker
export async function processBankSlipGenerated(job: any): Promise<void> {
  const { eventId, attemptNumber, payload } = job.data;
  
  try {
    const validatedPayload = bankSlipGeneratedSchema.parse(payload);
    
    logger.info('Processing BANK_SLIP_GENERATED email', {
      eventId,
      attemptNumber,
      customerEmail: validatedPayload.customer.email
    });

    // Importar serviço de email dinamicamente para evitar circular imports
    const { sendEmail } = await import('../services/email.service');
    
    // Preparar dados do email
    const template = bankSlipGeneratedTemplates[attemptNumber as keyof typeof bankSlipGeneratedTemplates];
    const subjectTemplate = bankSlipGeneratedSubjects[attemptNumber as keyof typeof bankSlipGeneratedSubjects];
    
    const emailData = {
      to: validatedPayload.customer.email,
      subject: subjectTemplate.replace('{customerName}', validatedPayload.customer.name),
      template,
      data: {
        customerName: validatedPayload.customer.name,
        transactionId: validatedPayload.transaction_id,
        orderNumber: validatedPayload.order_number,
        bankSlipUrl: validatedPayload.bank_slip_url,
        digitableLine: validatedPayload.digitable_line,
        barcode: validatedPayload.barcode,
        totalPrice: validatedPayload.total_price,
        dueDate: validatedPayload.due_date,
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
    
    logger.info('BANK_SLIP_GENERATED email sent successfully', {
      eventId,
      attemptNumber,
      template
    });
    
  } catch (error) {
    logger.error('Error processing BANK_SLIP_GENERATED email', {
      eventId,
      attemptNumber,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}