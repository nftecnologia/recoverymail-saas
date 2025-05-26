interface EmailTemplate {
  subject: string;
  templateName: string;
}

// Mapeamento de templates por evento e número da tentativa
const EMAIL_TEMPLATES: Record<string, Record<number, EmailTemplate>> = {
  ABANDONED_CART: {
    1: {
      subject: '🛒 Você esqueceu alguns itens no seu carrinho',
      templateName: 'abandoned-cart-reminder',
    },
    2: {
      subject: '⏰ Seus produtos estão quase acabando!',
      templateName: 'abandoned-cart-urgency',
    },
    3: {
      subject: '🎁 10% de desconto para finalizar sua compra',
      templateName: 'abandoned-cart-discount',
    },
  },
  BANK_SLIP_EXPIRED: {
    1: {
      subject: '⚠️ Seu boleto expirou - Gere um novo agora',
      templateName: 'bank-slip-expired-renewal',
    },
    2: {
      subject: '🔥 Ainda dá tempo! PIX com desconto exclusivo',
      templateName: 'bank-slip-expired-urgency',
    },
    3: {
      subject: '😢 Última chance com oferta especial',
      templateName: 'bank-slip-expired-lastchance',
    },
  },
  PIX_EXPIRED: {
    1: {
      subject: '⏱️ Seu PIX expirou - Gere um novo código',
      templateName: 'pix-expired-renewal',
    },
    2: {
      subject: '⚡ Último PIX disponível com 10% OFF',
      templateName: 'pix-expired-lastchance',
    },
  },
  SALE_REFUSED: {
    1: {
      subject: '❌ Pagamento não aprovado - Tente novamente',
      templateName: 'sale-refused-retry',
    },
    2: {
      subject: '💳 Problemas com o pagamento? Podemos ajudar',
      templateName: 'sale-refused-support',
    },
  },
  SALE_APPROVED: {
    1: {
      subject: '✅ Pagamento aprovado! Pedido confirmado',
      templateName: 'sale-approved-confirmation',
    },
  },
  SALE_CHARGEBACK: {
    1: {
      subject: '⚠️ Contestação recebida - Ação necessária',
      templateName: 'sale-chargeback-notice',
    },
  },
  SALE_REFUNDED: {
    1: {
      subject: '💰 Reembolso processado com sucesso',
      templateName: 'sale-refunded-confirmation',
    },
  },
  BANK_SLIP_GENERATED: {
    1: {
      subject: '📄 Seu boleto está pronto para pagamento',
      templateName: 'bank-slip-generated-reminder',
    },
    2: {
      subject: '⏰ Último dia para pagar seu boleto!',
      templateName: 'bank-slip-generated-lastday',
    },
  },
  PIX_GENERATED: {
    1: {
      subject: '⚡ Pague agora com PIX - Acesso imediato',
      templateName: 'pix-generated-qrcode',
    },
  },
  SUBSCRIPTION_CANCELED: {
    1: {
      subject: '😢 Assinatura cancelada - Confirmação',
      templateName: 'subscription-canceled-confirmation',
    },
    2: {
      subject: '💔 Sentimos sua falta... Que tal voltar?',
      templateName: 'subscription-canceled-winback',
    },
    3: {
      subject: '🎁 Última oferta imperdível para você voltar',
      templateName: 'subscription-canceled-final',
    },
  },
  SUBSCRIPTION_EXPIRED: {
    1: {
      subject: '⚠️ Sua assinatura expirou - Não perca seu progresso',
      templateName: 'subscription-expired-renewal',
    },
    2: {
      subject: '🔄 Última chance: 50% OFF na renovação',
      templateName: 'subscription-expired-lastchance',
    },
  },
  SUBSCRIPTION_RENEWED: {
    1: {
      subject: '✅ Assinatura renovada com sucesso!',
      templateName: 'subscription-renewed-confirmation',
    },
  },
};

export function getEmailTemplate(eventType: string, attemptNumber: number): EmailTemplate | null {
  const eventTemplates = EMAIL_TEMPLATES[eventType];
  if (!eventTemplates) {
    return null;
  }
  
  return eventTemplates[attemptNumber] || null;
}

export function getMaxAttemptsForEvent(eventType: string): number {
  const eventTemplates = EMAIL_TEMPLATES[eventType];
  if (!eventTemplates) {
    return 0;
  }
  
  return Object.keys(eventTemplates).length;
} 