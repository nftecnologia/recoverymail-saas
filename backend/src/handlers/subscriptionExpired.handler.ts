import { logger } from '../utils/logger';
import { sendEmail } from '../services/email.service';
import { prisma } from '../config/database';
import { getEmailTemplate } from '../utils/email.templates';
import { EmailJobData } from '../services/trigger.service';

export async function processSubscriptionExpired(data: EmailJobData): Promise<void> {
  const { eventId, organizationId, payload, attemptNumber } = data;
  const event = payload as any;

  logger.info('Processing subscription expired email', {
    eventId,
    attemptNumber,
    subscriptionId: event.subscription_id || event.id,
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

  // Buscar template para esta tentativa
  const template = getEmailTemplate('SUBSCRIPTION_EXPIRED', attemptNumber);
  if (!template) {
    throw new Error(`No template found for SUBSCRIPTION_EXPIRED attempt ${attemptNumber}`);
  }

  // Processar datas importantes
  const expiredAt = event.expiration?.expired_at || event.expired_at;
  const gracePeriodUntil = event.expiration?.grace_period_until || event.grace_period_until;
  const renewalValidUntil = event.renewal_offer?.valid_until || event.offer_valid_until;
  
  let formattedExpiredDate = 'não informado';
  let daysExpired = 0;
  let gracePeriodDays = 0;
  let offerValidDays = 0;

  if (expiredAt) {
    try {
      const expiredDate = new Date(expiredAt);
      formattedExpiredDate = expiredDate.toLocaleDateString('pt-BR');
      daysExpired = Math.ceil((Date.now() - expiredDate.getTime()) / (1000 * 60 * 60 * 24));
    } catch (e) {
      formattedExpiredDate = expiredAt;
    }
  }

  if (gracePeriodUntil) {
    try {
      const graceDate = new Date(gracePeriodUntil);
      gracePeriodDays = Math.ceil((graceDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    } catch (e) {
      // Ignore parsing error
    }
  }

  if (renewalValidUntil) {
    try {
      const offerDate = new Date(renewalValidUntil);
      offerValidDays = Math.ceil((offerDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    } catch (e) {
      // Ignore parsing error
    }
  }

  // Calcular desconto baseado na tentativa
  const discountPercent = attemptNumber === 1 ? 0 : 
                         attemptNumber === 2 ? 25 : 50; // Desconto crescente: 0%, 25%, 50%

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
    
    // Datas e prazos
    expiredAt: formattedExpiredDate,
    daysExpired,
    gracePeriodDays,
    hasGracePeriod: gracePeriodDays > 0,
    isInGracePeriod: gracePeriodDays > 0,
    
    // Motivo da expiração
    expirationReason: event.expiration?.reason || event.expiration_reason || 'PAYMENT_FAILED',
    failedAttempts: event.expiration?.failed_attempts || event.failed_attempts || 0,
    
    // Oferta de renovação
    hasRenewalOffer: !!(event.renewal_offer || discountPercent > 0),
    discountPercent,
    discountAmount: event.renewal_offer?.discount_amount || '',
    originalPrice: event.subscription_plan?.price || event.plan_price || '',
    offerValidDays,
    offerValidUntil: renewalValidUntil,
    
    // URLs de renovação
    renewalUrl: event.renewal_offer?.payment_link || event.checkout_url || event.renewal_url || '#',
    checkoutUrl: event.checkout_url || '#',
    
    // Planos alternativos
    alternativePlans: event.renewal_offer?.alternative_plans || event.alternative_plans || [],
    hasAlternativePlans: Array.isArray(event.renewal_offer?.alternative_plans || event.alternative_plans),
    
    // Backup de conteúdo
    contentBackup: event.content_backup || {},
    hasContentBackup: !!(event.content_backup?.download_link || event.backup_url),
    backupUrl: event.content_backup?.download_link || event.backup_url || '',
    backupValidUntil: event.content_backup?.available_until || '',
    contentList: event.content_backup?.content_list || [],
    
    // Estatísticas de uso
    usageStats: event.customer?.usage_stats || event.usage_stats || {},
    totalLogins: event.customer?.usage_stats?.total_logins || event.total_logins || 0,
    contentAccessed: event.customer?.usage_stats?.content_accessed || event.content_accessed || 0,
    completionRate: event.customer?.usage_stats?.completion_rate || event.completion_rate || '0%',
    hasUsageStats: !!(event.customer?.usage_stats || event.usage_stats),
    
    // Datas importantes do histórico
    subscriptionStartDate: event.customer?.subscription_start_date || event.start_date || '',
    lastPaymentDate: event.customer?.last_payment_date || event.last_payment || '',
    totalPaid: event.customer?.total_paid || event.total_paid || '',
    
    // URLs importantes
    supportUrl: event.support_url || 'https://suporte.empresa.com',
    accountUrl: event.account_url || event.platform_url || '#',
    
    // Organização
    organizationName: organization.name,
    organizationEmail: (organization.emailSettings as any)?.fromEmail || 'noreply@empresa.com',
    
    // Controle de tentativas
    isNotification: attemptNumber === 1,     // Primeira notificação
    isRenewalOffer: attemptNumber === 2,     // Oferta de renovação
    isLastChance: attemptNumber === 3,       // Última chance
    attemptNumber,
    
    // Estados baseados no tempo
    isRecentExpiry: daysExpired <= 7,
    isLongExpired: daysExpired > 30,
    urgencyLevel: attemptNumber === 1 ? 'medium' : 
                 attemptNumber === 2 ? 'high' : 'critical',
    
    // Incentivos baseados na tentativa
    showDiscount: attemptNumber >= 2,
    showUrgency: attemptNumber >= 2,
    showDataLossWarning: attemptNumber === 3,
    
    // Call-to-actions dinâmicos
    ctaText: attemptNumber === 1 ? 'RENOVAR ASSINATURA' :
             attemptNumber === 2 ? `RENOVAR COM ${discountPercent}% OFF` :
             'ÚLTIMA CHANCE - RENOVAR AGORA',
    
    // Dados adicionais
    utm: event.utm || {},
    customerId: event.customer_id || event.customer?.id || '',
    
    // Status da conta
    accountStatus: 'EXPIRED',
    accessStatus: gracePeriodDays > 0 ? 'LIMITED' : 'SUSPENDED'
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

    logger.info('Subscription expired email sent successfully', {
      eventId,
      attemptNumber,
      emailId,
      planName: templateData.planName,
      discountPercent
    });
  } catch (error) {
    logger.error('Failed to send subscription expired email', {
      eventId,
      attemptNumber,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
