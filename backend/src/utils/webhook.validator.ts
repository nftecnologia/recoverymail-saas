import { z } from 'zod';
import { WebhookEvent } from '../types/webhook.types';
import { AppError } from './errors';

// Schemas comuns
const customerSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone_number: z.string().optional(),
});

const productSchema = z.object({
  name: z.string(),
  price: z.string(),
  quantity: z.number().optional(),
  image_url: z.string().url().optional(),
});

// Schema para ABANDONED_CART
const abandonedCartSchema = z.object({
  event: z.literal('ABANDONED_CART'),
  checkout_id: z.string(),
  checkout_url: z.string().url(),
  total_price: z.string(),
  customer: customerSchema,
  products: z.array(productSchema),
  abandoned_at: z.string().optional(),
});

// Schema para BANK_SLIP_EXPIRED
const bankSlipExpiredSchema = z.object({
  event: z.literal('BANK_SLIP_EXPIRED'),
  transaction_id: z.string(),
  bank_slip_url: z.string().url(),
  bank_slip_code: z.string(),
  total_price: z.string(),
  customer: customerSchema,
  expired_at: z.string(),
  checkout_url: z.string().url().optional(),
});

// Schema para PIX_EXPIRED
const pixExpiredSchema = z.object({
  event: z.literal('PIX_EXPIRED'),
  transaction_id: z.string(),
  pix_qr_code: z.string(),
  pix_copy_paste: z.string(),
  total_price: z.string(),
  customer: customerSchema,
  expired_at: z.string(),
  checkout_url: z.string().url().optional(),
});

// Schema para SALE_REFUSED
const saleRefusedSchema = z.object({
  event: z.literal('SALE_REFUSED'),
  transaction_id: z.string(),
  reason: z.string(),
  total_price: z.string(),
  customer: customerSchema,
  checkout_url: z.string().url().optional(),
  payment_method: z.string(),
});

// Schema para SALE_APPROVED
const saleApprovedSchema = z.object({
  event: z.literal('SALE_APPROVED'),
  transaction_id: z.string(),
  order_id: z.string(),
  total_price: z.string(),
  customer: customerSchema,
  products: z.array(productSchema),
  tracking_url: z.string().url().optional(),
});

// Schema para SALE_CHARGEBACK
const saleChargebackSchema = z.object({
  event: z.literal('SALE_CHARGEBACK'),
  transaction_id: z.string(),
  order_id: z.string(),
  reason: z.string(),
  total_price: z.string(),
  customer: customerSchema,
  chargeback_date: z.string(),
});

// Schema para SALE_REFUNDED
const saleRefundedSchema = z.object({
  event: z.literal('SALE_REFUNDED'),
  transaction_id: z.string(),
  order_id: z.string(),
  refund_amount: z.string(),
  reason: z.string().optional(),
  customer: customerSchema,
  refund_date: z.string(),
});

// Schema para BANK_SLIP_GENERATED
const bankSlipGeneratedSchema = z.object({
  event: z.literal('BANK_SLIP_GENERATED'),
  transaction_id: z.string(),
  bank_slip_url: z.string().url(),
  bank_slip_code: z.string(),
  total_price: z.string(),
  customer: customerSchema,
  due_date: z.string(),
});

// Schema para PIX_GENERATED
const pixGeneratedSchema = z.object({
  event: z.literal('PIX_GENERATED'),
  transaction_id: z.string(),
  pix_qr_code: z.string(),
  pix_copy_paste: z.string(),
  total_price: z.string(),
  customer: customerSchema,
  expires_at: z.string(),
});

// Schema para SUBSCRIPTION_CANCELED
const subscriptionCanceledSchema = z.object({
  event: z.literal('SUBSCRIPTION_CANCELED'),
  subscription_id: z.string(),
  customer: customerSchema,
  plan_name: z.string(),
  cancellation_reason: z.string().optional(),
  canceled_at: z.string(),
});

// Schema para SUBSCRIPTION_EXPIRED
const subscriptionExpiredSchema = z.object({
  event: z.literal('SUBSCRIPTION_EXPIRED'),
  subscription_id: z.string(),
  customer: customerSchema,
  plan_name: z.string(),
  expired_at: z.string(),
  renewal_url: z.string().url().optional(),
});

// Schema para SUBSCRIPTION_RENEWED
const subscriptionRenewedSchema = z.object({
  event: z.literal('SUBSCRIPTION_RENEWED'),
  subscription_id: z.string(),
  customer: customerSchema,
  plan_name: z.string(),
  next_billing_date: z.string(),
  total_price: z.string(),
});

// União de todos os schemas
const webhookEventSchema = z.discriminatedUnion('event', [
  abandonedCartSchema,
  bankSlipExpiredSchema,
  pixExpiredSchema,
  saleRefusedSchema,
  saleApprovedSchema,
  saleChargebackSchema,
  saleRefundedSchema,
  bankSlipGeneratedSchema,
  pixGeneratedSchema,
  subscriptionCanceledSchema,
  subscriptionExpiredSchema,
  subscriptionRenewedSchema,
]);

export function validateWebhookPayload(payload: unknown): WebhookEvent {
  try {
    return webhookEventSchema.parse(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
      }));
      
      throw new AppError(
        `Invalid webhook payload: ${JSON.stringify(errors)}`,
        400
      );
    }
    
    throw new AppError('Failed to validate webhook payload', 400);
  }
}

// Função auxiliar para obter o tipo de evento
export function getEventType(payload: unknown): string | null {
  try {
    const basicSchema = z.object({
      event: z.string(),
    });
    
    const result = basicSchema.safeParse(payload);
    return result.success ? result.data.event : null;
  } catch {
    return null;
  }
} 