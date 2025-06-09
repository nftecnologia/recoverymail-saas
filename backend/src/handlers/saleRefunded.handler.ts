import { logger } from '../utils/logger';
import { sendEmail } from '../services/email.service';
import { prisma } from '../config/database';
import { getEmailTemplate } from '../utils/email.templates';
import { EmailJobData } from '../services/trigger.service';

export async function processSaleRefunded(data: EmailJobData): Promise<void> {
  const { eventId, organizationId, payload, attemptNumber } = data;
  const event = payload as any;

  logger.info('Processing sale refunded email', {
    eventId,
    attemptNumber,
    transactionId: event.transaction_id || event.order_id,
    customerEmail: event.customer?.email,
    refundId: event.refund_id,
    refundAmount: event.refund_amount,
  });

  // Buscar informações da organização
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true, domain: true, emailSettings: true },
  });

  if (!organization) {
    throw new Error(`Organization not found: ${organizationId}`);
  }

  // Extrair dados do payload
  const customerEmail = event.customer?.email;
  const customerName = event.customer?.name || 'Cliente';
  
  if (!customerEmail) {
    throw new Error('Customer email not found in payload');
  }

  // Buscar template para esta tentativa
  const template = getEmailTemplate('SALE_REFUNDED', attemptNumber);
  if (!template) {
    throw new Error(`No template found for SALE_REFUNDED attempt ${attemptNumber}`);
  }

  // Processar datas importantes
  const refundDate = event.refund_date || event.processed_at;
  const estimatedCreditDate = event.estimated_credit_date || event.credit_date;
  const originalPaymentDate = event.payment_original?.date || event.original_payment_date;
  
  let formattedRefundDate = new Date().toLocaleDateString('pt-BR');
  let formattedCreditDate = 'não informado';
  let formattedOriginalDate = 'não informado';
  let daysUntilCredit = 0;

  if (refundDate) {
    try {
      formattedRefundDate = new Date(refundDate).toLocaleDateString('pt-BR');
    } catch (e) {
      formattedRefundDate = refundDate;
    }
  }

  if (estimatedCreditDate) {
    try {
      const creditDate = new Date(estimatedCreditDate);
      formattedCreditDate = creditDate.toLocaleDateString('pt-BR');
      daysUntilCredit = Math.ceil((creditDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    } catch (e) {
      formattedCreditDate = estimatedCreditDate;
    }
  }

  if (originalPaymentDate) {
    try {
      formattedOriginalDate = new Date(originalPaymentDate).toLocaleDateString('pt-BR');
    } catch (e) {
      formattedOriginalDate = originalPaymentDate;
    }
  }

  // Mapear razões de reembolso para linguagem amigável
  const refundReasonMap: Record<string, string> = {
    'CUSTOMER_REQUEST': 'solicitação do cliente',
    'QUALITY_ISSUE': 'problema de qualidade',
    'NOT_AS_DESCRIBED': 'produto não conforme',
    'TECHNICAL_PROBLEM': 'problema técnico',
    'DUPLICATE_CHARGE': 'cobrança duplicada',
    'CHARGEBACK_PREVENTION': 'prevenção de contestação',
    'GOODWILL': 'cortesia da empresa',
    'OTHER': 'outros motivos'
  };

  const friendlyReason = refundReasonMap[event.refund_reason || 'CUSTOMER_REQUEST'] || 'solicitação de reembolso';

  // Preparar dados do template
  const templateData = {
    customerName: customerName.split(' ')[0], // Primeiro nome
    customerFullName: customerName,
    customerEmail,
    
    // Dados da transação
    transactionId: event.transaction_id || event.order_id || 'N/A',
    orderNumber: event.order_number || event.transaction_id || 'N/A',
    refundId: event.refund_id || 'N/A',
    
    // Datas importantes
    refundDate: formattedRefundDate,
    estimatedCreditDate: formattedCreditDate,
    originalPaymentDate: formattedOriginalDate,
    daysUntilCredit,
    
    // Valores
    refundAmount: event.refund_amount || event.amount || 'N/A',
    originalAmount: event.payment_original?.amount || event.original_amount || event.refund_amount || 'N/A',
    
    // Método de reembolso
    refundMethod: event.refund_method || event.method || 'Estorno no cartão',
    originalPaymentMethod: event.payment_original?.method || event.original_payment_method || 'Cartão de Crédito',
    
    // Motivo do reembolso
    refundReason: event.refund_reason || 'CUSTOMER_REQUEST',
    friendlyReason,
    
    // Produto
    product: event.product || {},
    productName: event.product?.name || event.product_name || 'seu produto',
    productId: event.product?.id || event.product_id || '',
    offerName: event.product?.offer_name || event.offer_name || '',
    
    // URLs importantes
    feedbackUrl: event.feedback_url || '#',
    supportUrl: event.support_url || 'https://suporte.empresa.com',
    accountUrl: event.account_url || '#',
    
    // Organização
    organizationName: organization.name,
    organizationEmail: (organization.emailSettings as any)?.fromEmail || 'noreply@empresa.com',
    
    // Oferta especial (win-back)
    specialOffer: event.special_offer || {},
    hasSpecialOffer: !!(event.special_offer?.discount_code || event.discount_code),
    discountCode: event.special_offer?.discount_code || event.discount_code || '',
    discountPercent: event.special_offer?.discount_percent || event.discount_percent || 0,
    offerValidUntil: event.special_offer?.valid_until || event.offer_valid_until || '',
    
    // Estados baseados no método
    isCreditCardRefund: (event.refund_method || event.method || '').toLowerCase().includes('cartao') || 
                       (event.refund_method || event.method || '').toLowerCase().includes('card'),
    isPixRefund: (event.refund_method || event.method || '').toLowerCase().includes('pix'),
    isBankRefund: (event.refund_method || event.method || '').toLowerCase().includes('banco') || 
                  (event.refund_method || event.method || '').toLowerCase().includes('ted'),
    
    // Tempo para crédito
    isFastCredit: daysUntilCredit <= 2,
    isSlowCredit: daysUntilCredit > 7,
    
    // Mensagens baseadas no método
    creditMessage: getCreditMessage(event.refund_method || event.method || 'card', daysUntilCredit),
    
    // Status do reembolso
    refundStatus: 'PROCESSED',
    isComplete: true,
    
    // Dados do cliente
    customerPhone: event.customer?.phone_number || '',
    customerDocument: event.customer?.document || '',
    
    // Feedback e satisfação
    shouldRequestFeedback: !event.skip_feedback,
    feedbackIncentive: event.feedback_incentive || '',
    
    // Call-to-action
    ctaText: event.special_offer ? 'VER OFERTA ESPECIAL' : 'AVALIAR ATENDIMENTO',
    
    // Dados adicionais
    utm: event.utm || {},
    
    // Política de reembolso
    refundPolicy: event.refund_policy || '',
    hasRefundPolicy: !!(event.refund_policy),
    
    // Motivo detalhado (se fornecido)
    detailedReason: event.detailed_reason || '',
    hasDetailedReason: !!(event.detailed_reason),
    
    // Informações do processamento
    processingTime: event.processing_time_days || daysUntilCredit || 0,
    processedBy: event.processed_by || 'Sistema Automático',
    
    // Data e hora do processamento
    refundTime: new Date().toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    
    // Agradecimento personalizado
    thankYouMessage: 'Obrigado por sua compreensão e confiança em nosso atendimento!'
  };

  try {
    // Enviar email
    const emailId = await sendEmail({
      to: customerEmail,
      subject: template.subject,
      template: template.templateName,
      data: templateData,
      organizationId,
      eventId,
      attemptNumber,
    });

    logger.info('Sale refunded email sent successfully', {
      eventId,
      attemptNumber,
      emailId,
      refundId: templateData.refundId,
      refundAmount: templateData.refundAmount
    });

  } catch (error) {
    logger.error('Failed to send sale refunded email', {
      eventId,
      attemptNumber,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// Função helper para mensagem de crédito baseada no método
function getCreditMessage(method: string, days: number): string {
  const methodLower = method.toLowerCase();
  
  if (methodLower.includes('pix')) {
    return days <= 1 ? 'O valor será creditado em até 1 dia útil via PIX' : 
           `O valor será creditado em até ${days} dias úteis via PIX`;
  }
  
  if (methodLower.includes('cartao') || methodLower.includes('card')) {
    return days <= 7 ? 'O estorno aparecerá na sua próxima fatura do cartão' :
           'O estorno aparecerá em até 2 faturas do seu cartão';
  }
  
  if (methodLower.includes('banco') || methodLower.includes('ted')) {
    return days <= 2 ? 'O valor será creditado em até 2 dias úteis na sua conta' :
           `O valor será creditado em até ${days} dias úteis na sua conta`;
  }
  
  return days <= 1 ? 'O valor será creditado em breve' :
         `O valor será creditado em até ${days} dias úteis`;
}
