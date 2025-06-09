import { logger } from '../utils/logger';
import { sendEmail } from '../services/email.service';
import { prisma } from '../config/database';
import { getEmailTemplate } from '../utils/email.templates';
import { EmailJobData } from '../services/trigger.service';

export async function processSaleChargeback(data: EmailJobData): Promise<void> {
  const { eventId, organizationId, payload, attemptNumber } = data;
  const event = payload as any;

  logger.info('Processing sale chargeback email', {
    eventId,
    attemptNumber,
    transactionId: event.transaction_id || event.order_id,
    customerEmail: event.customer?.email,
    chargebackId: event.chargeback_id,
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
  const template = getEmailTemplate('SALE_CHARGEBACK', attemptNumber);
  if (!template) {
    throw new Error(`No template found for SALE_CHARGEBACK attempt ${attemptNumber}`);
  }

  // Processar datas importantes
  const chargebackDate = event.chargeback_date || event.contested_at;
  const purchaseDate = event.purchase_date || event.original_purchase_date;
  
  let formattedChargebackDate = new Date().toLocaleDateString('pt-BR');
  let formattedPurchaseDate = 'não informado';
  let daysSincePurchase = 0;
  let daysToResolve = event.days_to_resolve || 7;

  if (chargebackDate) {
    try {
      formattedChargebackDate = new Date(chargebackDate).toLocaleDateString('pt-BR');
    } catch (e) {
      formattedChargebackDate = chargebackDate;
    }
  }

  if (purchaseDate) {
    try {
      const purchaseDateObj = new Date(purchaseDate);
      formattedPurchaseDate = purchaseDateObj.toLocaleDateString('pt-BR');
      daysSincePurchase = Math.ceil((Date.now() - purchaseDateObj.getTime()) / (1000 * 60 * 60 * 24));
    } catch (e) {
      formattedPurchaseDate = purchaseDate;
    }
  }

  // Mapear razões de chargeback para linguagem amigável
  const chargebackReasonMap: Record<string, string> = {
    'FRAUD': 'transação fraudulenta',
    'UNAUTHORIZED': 'transação não autorizada',
    'DUPLICATE_PROCESSING': 'cobrança duplicada',
    'CREDIT_NOT_PROCESSED': 'crédito não processado',
    'CANCELLED_RECURRING': 'cobrança recorrente cancelada',
    'PRODUCT_NOT_RECEIVED': 'produto não recebido',
    'PRODUCT_UNACCEPTABLE': 'produto não conforme',
    'OTHER': 'outros motivos'
  };

  const friendlyReason = chargebackReasonMap[event.chargeback_reason || 'OTHER'] || 'contestação bancária';

  // Preparar dados do template
  const templateData = {
    customerName: customerName.split(' ')[0], // Primeiro nome
    customerFullName: customerName,
    customerEmail,
    
    // Dados da transação
    transactionId: event.transaction_id || event.order_id || 'N/A',
    orderNumber: event.order_number || event.transaction_id || 'N/A',
    chargebackId: event.chargeback_id || 'N/A',
    
    // Datas importantes
    chargebackDate: formattedChargebackDate,
    purchaseDate: formattedPurchaseDate,
    daysSincePurchase,
    daysToResolve,
    
    // Valores
    amount: event.amount || event.total_price || 'N/A',
    chargebackAmount: event.chargeback_amount || event.amount || 'N/A',
    
    // Motivo da contestação
    chargebackReason: event.chargeback_reason || 'OTHER',
    friendlyReason,
    
    // Produto
    product: event.product || {},
    productName: event.product?.name || event.product_name || 'seu produto',
    productId: event.product?.id || event.product_id || '',
    offerName: event.product?.offer_name || event.offer_name || '',
    
    // Detalhes do pagamento
    paymentDetails: event.payment_details || {},
    paymentMethod: event.payment_details?.method || event.payment_method || 'Cartão de Crédito',
    cardLastDigits: event.payment_details?.card_last_digits || event.card_last_digits || '',
    billingDescriptor: event.payment_details?.billing_descriptor || event.billing_descriptor || '',
    
    // URLs de resolução
    resolutionUrl: event.resolution_url || event.dispute_url || '#',
    supportUrl: event.support_url || 'https://suporte.empresa.com',
    disputeUrl: event.dispute_url || event.resolution_url || '#',
    
    // Organização
    organizationName: organization.name,
    organizationEmail: (organization.emailSettings as any)?.fromEmail || 'noreply@empresa.com',
    organizationPhone: event.organization_phone || '',
    
    // Urgência e prazos
    isUrgent: daysToResolve <= 7,
    isCritical: daysToResolve <= 3,
    deadlineDate: new Date(Date.now() + (daysToResolve * 24 * 60 * 60 * 1000)).toLocaleDateString('pt-BR'),
    
    // Classificação de risco
    isHighRisk: ['FRAUD', 'UNAUTHORIZED'].includes(event.chargeback_reason || ''),
    isProcessingIssue: ['DUPLICATE_PROCESSING', 'CREDIT_NOT_PROCESSED'].includes(event.chargeback_reason || ''),
    isProductIssue: ['PRODUCT_NOT_RECEIVED', 'PRODUCT_UNACCEPTABLE'].includes(event.chargeback_reason || ''),
    
    // Ações recomendadas baseadas no motivo
    recommendedActions: getRecommendedActions(event.chargeback_reason || 'OTHER'),
    
    // Status da contestação
    chargebackStatus: 'PENDING_RESPONSE',
    canResolve: daysToResolve > 0,
    
    // Dados do cliente para verificação
    customerPhone: event.customer?.phone_number || '',
    customerDocument: event.customer?.document || '',
    
    // Informações para defesa
    defenseDocuments: event.defense_documents || [],
    hasDefenseDocuments: Array.isArray(event.defense_documents) && event.defense_documents.length > 0,
    
    // Call-to-action baseado na urgência
    ctaText: daysToResolve <= 3 ? 'RESOLVER AGORA - URGENTE!' : 'RESOLVER CONTESTAÇÃO',
    
    // Dados adicionais
    utm: event.utm || {},
    
    // Histórico de transações (se relevante)
    isRepeatCustomer: daysSincePurchase < 365 && (event.previous_purchases || 0) > 0,
    previousPurchases: event.previous_purchases || 0,
    
    // Status interno
    requiresImmedateAction: daysToResolve <= 3,
    autoEscalate: ['FRAUD', 'UNAUTHORIZED'].includes(event.chargeback_reason || ''),
    
    // Data limite formatada
    formattedDeadline: new Date(Date.now() + (daysToResolve * 24 * 60 * 60 * 1000)).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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

    logger.info('Sale chargeback email sent successfully', {
      eventId,
      attemptNumber,
      emailId,
      chargebackId: templateData.chargebackId,
      daysToResolve
    });

    // Log crítico para operações
    logger.warn('CHARGEBACK NOTIFICATION SENT - REQUIRES IMMEDIATE ATTENTION', {
      eventId,
      chargebackId: templateData.chargebackId,
      amount: templateData.amount,
      daysToResolve,
      customerEmail
    });

  } catch (error) {
    logger.error('Failed to send sale chargeback email', {
      eventId,
      attemptNumber,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// Função helper para ações recomendadas
function getRecommendedActions(reason: string): string[] {
  const actionMap: Record<string, string[]> = {
    'FRAUD': [
      'Verificar dados do cliente',
      'Coletar evidências de entrega',
      'Documentar tentativas de contato',
      'Preparar defesa contra fraude'
    ],
    'UNAUTHORIZED': [
      'Confirmar autorização do pagamento',
      'Verificar assinatura do cliente',
      'Coletar logs de acesso',
      'Documentar uso do produto'
    ],
    'DUPLICATE_PROCESSING': [
      'Verificar se houve cobrança duplicada',
      'Preparar comprovante de transação única',
      'Oferecer reembolso se procedente'
    ],
    'PRODUCT_NOT_RECEIVED': [
      'Verificar entrega do produto/acesso',
      'Coletar logs de download/acesso',
      'Documentar tentativas de suporte',
      'Oferecer novo acesso se necessário'
    ],
    'OTHER': [
      'Entrar em contato com o cliente',
      'Verificar motivo da contestação',
      'Coletar documentação relevante',
      'Preparar resposta adequada'
    ]
  };

  return actionMap[reason] || actionMap['OTHER'] || [];
}
