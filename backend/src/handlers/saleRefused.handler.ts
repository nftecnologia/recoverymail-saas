import { logger } from '../utils/logger';
import { sendEmail } from '../services/email.service';
import { prisma } from '../config/database';
import { EmailJobData } from '../services/trigger.service';

export async function processSaleRefused(data: EmailJobData): Promise<void> {
  const { eventId, organizationId, payload, attemptNumber } = data;
  const event = payload as any;

  logger.info('Processing sale refused email', {
    eventId,
    attemptNumber,
    transactionId: event.transaction_id || event.sale_id,
    customerEmail: event.customer?.email,
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

  // Determinar razão da recusa (se disponível)
  const refusedReason = event.refused_reason || event.payment?.refused_reason || 'problema com o cartão';
  const refusedCode = event.refused_code || event.payment?.refused_code || 'insufficient_funds';
  
  // Mapear códigos de recusa para mensagens amigáveis
  const refusedReasonMap: Record<string, string> = {
    'insufficient_funds': 'saldo insuficiente',
    'card_declined': 'cartão recusado',
    'expired_card': 'cartão vencido',
    'invalid_card': 'dados do cartão inválidos',
    'card_not_supported': 'cartão não aceito',
    'processing_error': 'erro no processamento',
    'fraud_suspected': 'transação suspeita',
  };

  const friendlyReason = refusedReasonMap[refusedCode] || refusedReason;

  // Determinar qual email enviar baseado no attemptNumber
  let subject: string;
  let templateName: string;
  
  switch (attemptNumber) {
    case 1:
      subject = '⚠️ Problema com seu pagamento - Vamos resolver juntos!';
      templateName = 'sale-refused-immediate';
      break;
    case 2:
      subject = '💳 Tente novamente com outro cartão - Oferta especial!';
      templateName = 'sale-refused-alternative';
      break;
    case 3:
      subject = '🎁 Última chance com desconto especial!';
      templateName = 'sale-refused-lastchance';
      break;
    default:
      throw new Error(`Invalid attempt number: ${attemptNumber}`);
  }

  // Calcular desconto crescente por tentativa
  const discountPercent = attemptNumber === 1 ? 0 : attemptNumber === 2 ? 5 : 10;
  let discountedPrice = event.total_price || event.amount;
  let savingsAmount = 'R$ 0,00';
  
  if (discountPercent > 0 && (event.total_price || event.amount)) {
    const priceValue = parseFloat(
      (event.total_price || event.amount).replace('R$', '').replace('.', '').replace(',', '.')
    );
    if (!isNaN(priceValue)) {
      const discountValue = priceValue * (1 - discountPercent / 100);
      const savings = priceValue - discountValue;
      
      discountedPrice = `R$ ${discountValue.toFixed(2).replace('.', ',')}`;
      savingsAmount = `R$ ${savings.toFixed(2).replace('.', ',')}`;
    }
  }

  // Sugerir métodos alternativos de pagamento
  const alternativePayments = [];
  if (refusedCode !== 'insufficient_funds') {
    alternativePayments.push('PIX (aprovação instantânea)');
  }
  if (!event.payment_method || event.payment_method !== 'bank_slip') {
    alternativePayments.push('Boleto bancário');
  }
  if (attemptNumber >= 2) {
    alternativePayments.push('Parcelamento em mais vezes');
  }

  // Preparar dados do template
  const templateData = {
    customerName: customerName.split(' ')[0], // Primeiro nome
    customerEmail,
    
    // Dados da transação
    transactionId: event.transaction_id || event.sale_id || 'N/A',
    totalPrice: event.total_price || event.amount || 'N/A',
    paymentMethod: event.payment_method || 'Cartão',
    
    // Problema
    refusedReason: friendlyReason,
    refusedCode,
    isInsufficientFunds: refusedCode === 'insufficient_funds',
    isCardProblem: ['card_declined', 'expired_card', 'invalid_card'].includes(refusedCode),
    
    // Produtos
    products: event.products || [],
    productName: event.products?.[0]?.name || event.product_name || 'seu produto',
    
    // URLs importantes
    checkoutUrl: event.checkout_url || event.payment_url || '#',
    newPaymentUrl: event.new_payment_url || event.checkout_url || '#',
    pixUrl: event.pix_url || event.checkout_url || '#',
    bankSlipUrl: event.bank_slip_url || event.checkout_url || '#',
    supportUrl: event.support_url || 'https://suporte.empresa.com',
    
    // Organização
    organizationName: organization.name,
    organizationEmail: (organization.emailSettings as any)?.fromEmail || 'noreply@empresa.com',
    
    // Desconto e ofertas
    hasDiscount: discountPercent > 0,
    discountPercent,
    discountedPrice,
    savingsAmount,
    
    // Pagamentos alternativos
    alternativePayments,
    hasAlternatives: alternativePayments.length > 0,
    
    // Controle de tentativas
    isFirstAttempt: attemptNumber === 1,
    isSecondAttempt: attemptNumber === 2,
    isLastAttempt: attemptNumber === 3,
    attemptNumber,
    
    // Urgência
    hasUrgency: attemptNumber >= 2,
    
    // Data limite (24h para resolver)
    deadlineDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
    deadlineTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  };

  try {
    // Enviar email
    const emailId = await sendEmail({
      to: customerEmail,
      subject,
      template: templateName,
      data: templateData,
      organizationId,
      eventId,
      attemptNumber,
    });

    logger.info('Sale refused email sent successfully', {
      eventId,
      attemptNumber,
      emailId,
      refusedReason: friendlyReason,
      discountPercent
    });
  } catch (error) {
    logger.error('Failed to send sale refused email', {
      eventId,
      attemptNumber,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
