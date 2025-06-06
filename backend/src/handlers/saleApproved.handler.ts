import { z } from 'zod';
import { logger } from '../utils/logger';
import { EmailJobData } from '../services/trigger.service';

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

// Função compatível com processo antigo (para uso direto)
export async function handleSaleApproved(
  payload: unknown,
  eventId: string,
  organizationId: string
) {
  // Validar payload
  const validatedPayload = saleApprovedSchema.parse(payload);
  
  logger.info('Processing SALE_APPROVED event', {
    eventId,
    organizationId,
    customerEmail: validatedPayload.customer.email,
    orderNumber: validatedPayload.order_number
  });

  // Não precisa mais gerenciar filas - isso será feito pelo Trigger.dev
}

// Função compatível com Job interface (para uso pelo Trigger.dev)
export async function processSaleApproved(job: { data: EmailJobData }) {
  const { sendEmail } = await import('../services/email.service');
  const { eventId, organizationId, payload, attemptNumber } = job.data;
  
  // Validar payload
  const validatedPayload = saleApprovedSchema.parse(payload);
  
  logger.info('Sending SALE_APPROVED email', {
    eventId,
    organizationId,
    customerEmail: validatedPayload.customer.email,
    attemptNumber
  });

  // Enviar email de confirmação de venda
  await sendEmail({
    to: validatedPayload.customer.email,
    subject: `🎉 Compra Confirmada - ${validatedPayload.product.name}`,
    template: 'sale-approved-confirmation',
    data: {
      customerName: validatedPayload.customer.name,
      orderNumber: validatedPayload.order_number,
      productName: validatedPayload.product.name,
      amount: validatedPayload.amount,
      paymentMethod: validatedPayload.payment_method,
      accessInfo: validatedPayload.access,
      bonuses: validatedPayload.bonuses,
      community: validatedPayload.community
    },
    organizationId,
    eventId,
    attemptNumber
  });

  logger.info('SALE_APPROVED email sent successfully', {
    eventId,
    organizationId,
    customerEmail: validatedPayload.customer.email
  });
}

// Template único para confirmação
export const saleApprovedTemplate = 'sale-approved-confirmation';

// Assunto do email
export const saleApprovedSubject = '✅ Parabéns {customerName}! Seja muito bem-vindo(a)!'; 