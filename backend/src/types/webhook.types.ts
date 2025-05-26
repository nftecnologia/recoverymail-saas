export const EVENT_TYPES = [
  'ABANDONED_CART',
  'BANK_SLIP_EXPIRED',
  'PIX_EXPIRED',
  'SALE_REFUSED',
  'SALE_APPROVED',
  'SALE_CHARGEBACK',
  'SALE_REFUNDED',
  'BANK_SLIP_GENERATED',
  'PIX_GENERATED',
  'SUBSCRIPTION_CANCELED',
  'SUBSCRIPTION_EXPIRED',
  'SUBSCRIPTION_RENEWED',
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

// Base webhook structure
export interface WebhookPayload {
  event: EventType;
  timestamp: string;
  organization_id: string;
  data: Record<string, unknown>;
}

// Customer data
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  document?: string;
}

// Product data
export interface Product {
  product_id: string;
  name: string;
  variant?: string;
  quantity: number;
  price: number;
  image_url?: string;
}

// Specific webhook payloads
export interface AbandonedCartPayload extends WebhookPayload {
  event: 'ABANDONED_CART';
  data: {
    checkout_id: string;
    checkout_url: string;
    abandoned_at: string;
    currency: string;
    total_price: number;
    subtotal: number;
    shipping: number;
    discount: number;
    customer: Customer;
    items: Product[];
    utm_params?: Record<string, string>;
  };
}

export interface BankSlipExpiredPayload extends WebhookPayload {
  event: 'BANK_SLIP_EXPIRED';
  data: {
    order_id: string;
    bank_slip_id: string;
    expired_at: string;
    original_due_date: string;
    amount: number;
    customer: Customer;
    order_details: {
      items_count: number;
      created_at: string;
    };
  };
}

export interface PixExpiredPayload extends WebhookPayload {
  event: 'PIX_EXPIRED';
  data: {
    order_id: string;
    pix_id: string;
    qr_code: string;
    qr_code_url: string;
    expired_at: string;
    created_at: string;
    amount: number;
    customer: Customer;
  };
}

// Additional webhook payloads
export interface SaleRefusedPayload extends WebhookPayload {
  event: 'SALE_REFUSED';
  data: {
    order_id: string;
    refused_at: string;
    reason: string;
    amount: number;
    customer: Customer;
    payment_method: string;
  };
}

export interface SaleApprovedPayload extends WebhookPayload {
  event: 'SALE_APPROVED';
  data: {
    order_id: string;
    approved_at: string;
    amount: number;
    customer: Customer;
    items: Product[];
  };
}

export interface SaleChargebackPayload extends WebhookPayload {
  event: 'SALE_CHARGEBACK';
  data: {
    order_id: string;
    chargeback_at: string;
    amount: number;
    reason: string;
    customer: Customer;
  };
}

export interface SaleRefundedPayload extends WebhookPayload {
  event: 'SALE_REFUNDED';
  data: {
    order_id: string;
    refunded_at: string;
    amount: number;
    reason?: string;
    customer: Customer;
  };
}

export interface BankSlipGeneratedPayload extends WebhookPayload {
  event: 'BANK_SLIP_GENERATED';
  data: {
    order_id: string;
    bank_slip_id: string;
    bank_slip_url: string;
    bar_code: string;
    due_date: string;
    amount: number;
    customer: Customer;
  };
}

export interface PixGeneratedPayload extends WebhookPayload {
  event: 'PIX_GENERATED';
  data: {
    order_id: string;
    pix_id: string;
    qr_code: string;
    qr_code_url: string;
    expires_at: string;
    amount: number;
    customer: Customer;
  };
}

export interface SubscriptionCanceledPayload extends WebhookPayload {
  event: 'SUBSCRIPTION_CANCELED';
  data: {
    subscription_id: string;
    canceled_at: string;
    reason?: string;
    customer: Customer;
    plan: {
      name: string;
      price: number;
      interval: string;
    };
    stats?: {
      months_active: number;
      total_paid: number;
      last_payment_date: string;
      usage_percentage: number;
    };
    benefits?: {
      used: string[];
      unused: string[];
      most_accessed_feature: string;
      total_logins: number;
      last_login_date: string;
    };
    community?: {
      posts_created: number;
      comments: number;
      likes_received: number;
      connections_made: number;
    };
  };
}

export interface SubscriptionExpiredPayload extends WebhookPayload {
  event: 'SUBSCRIPTION_EXPIRED';
  data: {
    subscription_id: string;
    expired_at: string;
    customer: Customer;
    plan: {
      name: string;
      price: number;
      interval: string;
    };
  };
}

export interface SubscriptionRenewedPayload extends WebhookPayload {
  event: 'SUBSCRIPTION_RENEWED';
  data: {
    subscription_id: string;
    renewed_at: string;
    next_renewal_date: string;
    renewal_id: string;
    customer: Customer;
    plan: {
      name: string;
      price: number;
      interval: string;
    };
    product?: {
      name: string;
    };
  };
}

// Union type for all webhook payloads
export type WebhookEvent =
  | AbandonedCartPayload
  | BankSlipExpiredPayload
  | PixExpiredPayload
  | SaleRefusedPayload
  | SaleApprovedPayload
  | SaleChargebackPayload
  | SaleRefundedPayload
  | BankSlipGeneratedPayload
  | PixGeneratedPayload
  | SubscriptionCanceledPayload
  | SubscriptionExpiredPayload
  | SubscriptionRenewedPayload;

// Webhook processing result
export interface WebhookResult {
  success: boolean;
  eventId?: string;
  error?: string;
  scheduledEmails?: number;
} 