import { logger } from '../utils/logger';
import { sendEmail } from '../services/email.service';
import { prisma } from '../config/database';
import { getEmailTemplate } from '../utils/email.templates';
import { EmailJobData } from '../services/trigger.service';

export async function processSubscriptionCanceled(data: EmailJobData): Promise<void> {
  const { eventId, organizationId, payload, attemptNumber } = data;
  const event = payload as any;

  logger.info('Processing subscription canceled email', {
    eventId,
    attemptNumber,
    subscriptionId: event.subscription_id || event.id,
    customerEmail: event.customer?.email,
    cancellationReason: event.cancellation?.reason || event.reason,
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
  const template = getEmailTemplate('SUBSCRIPTION_CANCELED', attemptNumber);
  if (!template) {
    throw new Error(`No template found for SUBSCRIPTION_CANCELED attempt ${attemptNumber}`);
  }

  // Processar datas importantes
  const canceledAt = event.cancellation?.canceled_at || event.canceled_at;
  const effectiveUntil = event.cancellation?.effective_until || event.effective_until;
  const winBackValidUntil = event.win_back_offer?.valid_until || event.offer_valid_until;
  
  let formattedCanceledDate = 'não informado';
  let daysSinceCanceled = 0;
  let daysUntilLoss = 0;
  let winBackValidDays = 0;

  if (canceledAt) {
    try {
      const canceledDate = new Date(canceledAt);
      formattedCanceledDate = canceledDate.toLocaleDateString('pt-BR');
      daysSinceCanceled = Math.ceil((Date.now() - canceledDate.getTime()) / (1000 * 60 * 60 * 24));
    } catch (e) {
      formattedCanceledDate = canceledAt;
    }
  }

  if (effectiveUntil) {
    try {
      const effectiveDate = new Date(effectiveUntil);
      daysUntilLoss = Math.ceil((effectiveDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    } catch (e) {
      // Ignore parsing error
    }
  }

  if (winBackValidUntil) {
    try {
      const offerDate = new Date(winBackValidUntil);
      winBackValidDays = Math.ceil((offerDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    } catch (e) {
      // Ignore parsing error
    }
  }

  // Calcular desconto de win-back baseado na tentativa
  const winBackDiscountPercent = attemptNumber === 1 ? 0 : 
                                attemptNumber === 2 ? 30 : 50; // Desconto crescente: 0%, 30%, 50%

  // Mapear razões de cancelamento para mensagens empáticas
  const cancellationReasonMap: Record<string, string> = {
    'PRICE': 'preço muito alto',
    'NOT_USING': 'não estava usando o suficiente',
    'FOUND_ALTERNATIVE': 'encontrou uma alternativa',
    'TECHNICAL_ISSUES': 'problemas técnicos',
    'POOR_SUPPORT': 'atendimento insatisfatório',
    'MISSING_FEATURES': 'faltavam funcionalidades',
    'COMPLICATED_TO_USE': 'difícil de usar',
    'OTHER': 'outros motivos'
  };

  const friendlyReason = cancellationReasonMap[event.cancellation?.reason || event.reason || 'OTHER'] || 'motivos pessoais';

  // Preparar dados do template
  const templateData = {
    customerName: customerName.split(' ')[0], // Primeiro nome
    customerFullName: customerName,
    customerEmail,
    
    // Dados da assinatura
    subscriptionId: event.subscription_id || event.id || 'N/A',
    subscriptionPlan: event.subscription_plan || event.plan || {},
    planName: event.subscription_plan?.name || event.plan_name || 'Sua Assinatura',
    planPrice: event.subscription_plan?.price || event.plan_price || 'N/A',
    billingCycle: event.subscription_plan?.billing_cycle || event.billing_cycle || 'MONTHLY',
    
    // Dados do cancelamento
    canceledAt: formattedCanceledDate,
    daysSinceCanceled,
    cancellationReason: event.cancellation?.reason || event.reason || 'OTHER',
    friendlyReason,
    canceledBy: event.cancellation?.canceled_by || event.canceled_by || 'CUSTOMER',
    refundAmount: event.cancellation?.refund_amount || event.refund_amount || '',
    
    // Acesso restante
    effectiveUntil,
    daysUntilLoss,
    hasRemainingAccess: daysUntilLoss > 0,
    isAccessEnding: daysUntilLoss <= 7 && daysUntilLoss > 0,
    
    // Benefícios perdidos
    benefitsLost: event.benefits_lost || [],
    hasBenefitsLost: Array.isArray(event.benefits_lost) && event.benefits_lost.length > 0,
    totalValueLost: event.benefits_lost?.reduce((sum: number, benefit: any) => {
      const value = parseFloat(benefit.value_estimate?.replace(/[^\d,]/g, '').replace(',', '.') || '0');
      return sum + value;
    }, 0) || 0,
    
    // Oferta de win-back
    hasWinBackOffer: !!(event.win_back_offer || winBackDiscountPercent > 0),
    winBackDiscountPercent,
    winBackDiscountAmount: event.win_back_offer?.discount_amount || '',
    winBackValidDays,
    winBackValidUntil,
    specialTerms: event.win_back_offer?.special_terms || '',
    
    // URLs de reativação
    winBackUrl: event.win_back_offer?.payment_link || event.checkout_url || event.reactivation_url || '#',
    checkoutUrl: event.checkout_url || '#',
    feedbackUrl: event.feedback_url || '#',
    
    // Histórico do cliente
    subscriptionStartDate: event.customer?.subscription_start_date || event.start_date || '',
    totalPaid: event.customer?.total_paid || event.total_paid || '',
    subscriptionDuration: event.subscription_duration_months || 0,
    
    // URLs importantes
    supportUrl: event.support_url || 'https://suporte.empresa.com',
    accountUrl: event.account_url || event.platform_url || '#',
    
    // Organização
    organizationName: organization.name,
    organizationEmail: (organization.emailSettings as any)?.fromEmail || 'noreply@empresa.com',
    
    // Controle de tentativas
    isConfirmation: attemptNumber === 1,        // Confirmação e feedback
    isWinBackOffer: attemptNumber === 2,        // Oferta de win-back
    isLastChance: attemptNumber === 3,          // Última chance
    attemptNumber,
    
    // Estados baseados no tempo
    isRecentCancellation: daysSinceCanceled <= 3,
    isLongTimeSinceCanceled: daysSinceCanceled > 30,
    
    // Estratégias de win-back baseadas na razão
    isPriceIssue: (event.cancellation?.reason || event.reason) === 'PRICE',
    isUsageIssue: (event.cancellation?.reason || event.reason) === 'NOT_USING',
    isTechnicalIssue: (event.cancellation?.reason || event.reason) === 'TECHNICAL_ISSUES',
    isCompetitorIssue: (event.cancellation?.reason || event.reason) === 'FOUND_ALTERNATIVE',
    
    // Incentivos baseados na tentativa
    showFeedbackRequest: attemptNumber === 1,
    showDiscount: attemptNumber >= 2,
    showUrgency: attemptNumber >= 2,
    showScarcity: attemptNumber === 3,
    
    // Call-to-actions dinâmicos
    ctaText: attemptNumber === 1 ? 'DAR FEEDBACK' :
             attemptNumber === 2 ? `VOLTAR COM ${winBackDiscountPercent}% OFF` :
             'ÚLTIMA CHANCE - REATIVAR AGORA',
    
    // Dados adicionais
    utm: event.utm || {},
    customerId: event.customer_id || event.customer?.id || '',
    
    // Status da conta
    accountStatus: daysUntilLoss > 0 ? 'CANCELED_WITH_ACCESS' : 'CANCELED_NO_ACCESS',
    
    // Personalização baseada no perfil
    isHighValueCustomer: parseFloat(event.customer?.total_paid?.replace(/[^\d,]/g, '').replace(',', '.') || '0') > 500,
    isLongTermCustomer: (event.subscription_duration_months || 0) > 6,
    
    // Ofertas especiais baseadas no perfil
    deservesPremiumOffer: attemptNumber === 3 && parseFloat(event.customer?.total_paid?.replace(/[^\d,]/g, '').replace(',', '.') || '0') > 300,
    
    // Dados de progresso perdido
    progressLost: event.progress_lost || {},
    hasProgressLost: !!(event.progress_lost),
    
    // Data limite da oferta
    offerDeadline: winBackValidUntil ? new Date(winBackValidUntil).toLocaleDateString('pt-BR') : ''
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

    logger.info('Subscription canceled email sent successfully', {
      eventId,
      attemptNumber,
      emailId,
      planName: templateData.planName,
      winBackDiscountPercent,
      cancellationReason: friendlyReason
    });
  } catch (error) {
    logger.error('Failed to send subscription canceled email', {
      eventId,
      attemptNumber,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
