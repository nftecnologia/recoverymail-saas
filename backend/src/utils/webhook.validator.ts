import { z } from 'zod';
import { WebhookEvent } from '../types/webhook.types';
import { AppError } from './errors';

// Schemas comuns
const customerSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone_number: z.string().optional(),
  document: z.string().optional(), // CPF/CNPJ para infoprodutos
});

// Schema atualizado para produtos de infoprodutos
const productSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  price: z.string(),
  quantity: z.number().optional(),
  image_url: z.string().url().optional(),
  // Campos específicos de infoprodutos
  offer_id: z.string().optional(),
  offer_name: z.string().optional(),
  description: z.string().optional(),
  photo: z.string().url().optional(),
  is_order_bump: z.boolean().optional(),
});

// Schema para dados UTM (tracking de campanhas)
const utmSchema = z.object({
  src: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_term: z.string().optional(),
  utm_content: z.string().optional(),
}).optional();

// Schema para dados de pagamento
const paymentSchema = z.object({
  method: z.enum(['CREDIT_CARD', 'BANK_SLIP', 'PIX']).optional(),
  brand: z.string().optional(),
  installments: z.number().optional(),
  link: z.string().url().optional(),
  digitable_line: z.string().optional(),
  barcode: z.string().optional(),
  expires_at: z.string().optional(),
  finished_at: z.string().optional(),
}).optional();

// Schema para planos de assinatura
const planSchema = z.object({
  name: z.string(),
  charge_frequency: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUALLY']).optional(),
  next_charge_date: z.string().optional(),
}).optional();

// Schema para ABANDONED_CART com campos de infoprodutos
const abandonedCartSchema = z.object({
  event: z.literal('ABANDONED_CART'),
  checkout_id: z.string(),
  checkout_url: z.string().url(),
  total_price: z.string(),
  customer: customerSchema,
  products: z.array(productSchema),
  abandoned_at: z.string().optional(),
  // Campos adicionais de infoprodutos
  sale_id: z.string().optional(),
  payment_method: z.string().optional(),
  type: z.enum(['ONE_TIME', 'RECURRING']).optional(),
  status: z.string().optional(),
  created_at: z.string().optional(),
  utm: utmSchema,
});

// Schema para BANK_SLIP_EXPIRED
const bankSlipExpiredSchema = z.object({
  event: z.literal('BANK_SLIP_EXPIRED'),
  transaction_id: z.string().optional(),
  bank_slip_url: z.string().url().optional(),
  bank_slip_code: z.string().optional(),
  total_price: z.string(),
  customer: customerSchema,
  expired_at: z.string().optional(),
  checkout_url: z.string().url().optional(),
  // Campos de infoprodutos
  sale_id: z.string().optional(),
  payment_method: z.string().optional(),
  type: z.enum(['ONE_TIME', 'RECURRING']).optional(),
  status: z.string().optional(),
  created_at: z.string().optional(),
  payment: paymentSchema,
  products: z.array(productSchema).optional(),
  utm: utmSchema,
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
  order_number: z.string(),
  payment_method: z.string(),
  refusal_reason: z.string().optional(),
  refusal_code: z.string().optional(),
  amount: z.string(),
  customer: customerSchema,
  product: productSchema,
  checkout_url: z.string().url(),
  utm: utmSchema,
});

// Schema para SALE_APPROVED
const saleApprovedSchema = z.object({
  event: z.literal('SALE_APPROVED'),
  transaction_id: z.string(),
  order_number: z.string(),
  payment_method: z.string(),
  amount: z.string(),
  installments: z.number().optional(),
  customer: customerSchema,
  product: productSchema,
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
  }).optional(),
});

// Schema para SALE_CHARGEBACK
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
  customer: customerSchema,
  product: productSchema,
  payment_details: z.object({
    method: z.string(),
    card_last_digits: z.string().optional(),
    billing_descriptor: z.string().optional()
  }).optional(),
  resolution_url: z.string().url().optional()
});

// Schema para SALE_REFUNDED
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
  customer: customerSchema,
  product: productSchema,
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

// Schema para BANK_SLIP_GENERATED compatível com Kirvano
const bankSlipGeneratedSchema = z.object({
  event: z.literal('BANK_SLIP_GENERATED'),
  transaction_id: z.string().optional(),
  bank_slip_url: z.string().url().optional(),
  bank_slip_code: z.string().optional(),
  total_price: z.string(),
  customer: customerSchema,
  due_date: z.string().optional(),
  // Campos de infoprodutos
  checkout_id: z.string().optional(),
  sale_id: z.string().optional(),
  payment_method: z.string().optional(),
  type: z.enum(['ONE_TIME', 'RECURRING']).optional(),
  status: z.string().optional(),
  created_at: z.string().optional(),
  payment: paymentSchema,
  products: z.array(productSchema).optional(),
  utm: utmSchema,
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

// Schema para SUBSCRIPTION_EXPIRED compatível com infoprodutos
const subscriptionExpiredSchema = z.object({
  event: z.literal('SUBSCRIPTION_EXPIRED'),
  subscription_id: z.string().optional(),
  customer: customerSchema,
  plan_name: z.string().optional(),
  expired_at: z.string().optional(),
  renewal_url: z.string().url().optional(),
  // Campos de infoprodutos
  checkout_id: z.string().optional(),
  sale_id: z.string().optional(),
  payment_method: z.string().optional(),
  total_price: z.string().optional(),
  type: z.literal('RECURRING').optional(),
  status: z.string().optional(),
  created_at: z.string().optional(),
  payment: paymentSchema,
  plan: planSchema,
  products: z.array(productSchema).optional(),
  utm: utmSchema,
});

// Schema para SUBSCRIPTION_RENEWED compatível com infoprodutos
const subscriptionRenewedSchema = z.object({
  event: z.literal('SUBSCRIPTION_RENEWED'),
  subscription_id: z.string(),
  renewal_id: z.string(),
  renewal_date: z.string(),
  next_renewal_date: z.string(),
  plan: z.object({
    id: z.string(),
    name: z.string(),
    billing_period: z.enum(['monthly', 'quarterly', 'yearly']),
    amount: z.string()
  }),
  customer: z.object({
    name: z.string(),
    email: z.string().email(),
    phone_number: z.string().optional(),
    document: z.string().optional(),
    member_since: z.string().optional()
  }),
  product: z.object({
    id: z.string(),
    name: z.string(),
    platform_url: z.string().url()
  }),
  stats: z.object({
    completed_lessons: z.number().optional(),
    certificates_earned: z.number().optional(),
    hours_watched: z.number().optional(),
    membership_months: z.number().optional()
  }).optional(),
  benefits: z.object({
    monthly_updates: z.array(z.string()).optional(),
    loyalty_discount: z.object({
      percent: z.number(),
      months: z.number()
    }).optional(),
    exclusive_bonus: z.object({
      name: z.string(),
      description: z.string()
    }).optional()
  }).optional(),
  community: z.object({
    discord_url: z.string().url().optional(),
    telegram_url: z.string().url().optional(),
    facebook_group_url: z.string().url().optional(),
    members_count: z.number().optional()
  }).optional()
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