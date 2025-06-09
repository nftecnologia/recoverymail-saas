import { logger } from '../utils/logger';
import { sendEmail } from '../services/email.service';
import { prisma } from '../config/database';
import { getEmailTemplate } from '../utils/email.templates';
import { EmailJobData } from '../services/trigger.service';

export async function processSubscriptionRenewed(data: EmailJobData): Promise<void> {
  const { eventId, organizationId, payload, attemptNumber } = data;
  const event = payload as any;

  logger.info('Processing subscription renewed email', {
    eventId,
    attemptNumber,
    subscriptionId: event.subscription_id || event.id,
    customerEmail: event.customer?.email,
    planName: event.plan?.name || event.plan_name,
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
  const template = getEmailTemplate('SUBSCRIPTION_RENEWED', attemptNumber);
  if (!template) {
    throw new Error(`No template found for SUBSCRIPTION_RENEWED attempt ${attemptNumber}`);
  }

  // Processar datas importantes
  const renewalDate = event.renewal_date || event.renewed_at;
  const nextRenewalDate = event.next_renewal_date || event.next_billing_date;
  const memberSince = event.customer?.member_since || event.member_since;
  
  let formattedRenewalDate = new Date().toLocaleDateString('pt-BR');
  let formattedNextRenewalDate = 'não informado';
  let formattedMemberSince = 'não informado';
  let daysUntilNextRenewal = 30; // Default
  let membershipMonths = 0;

  if (renewalDate) {
    try {
      formattedRenewalDate = new Date(renewalDate).toLocaleDateString('pt-BR');
    } catch (e) {
      formattedRenewalDate = renewalDate;
    }
  }

  if (nextRenewalDate) {
    try {
      const nextDate = new Date(nextRenewalDate);
      formattedNextRenewalDate = nextDate.toLocaleDateString('pt-BR');
      daysUntilNextRenewal = Math.ceil((nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    } catch (e) {
      formattedNextRenewalDate = nextRenewalDate;
    }
  }

  if (memberSince) {
    try {
      const memberDate = new Date(memberSince);
      formattedMemberSince = memberDate.toLocaleDateString('pt-BR');
      membershipMonths = Math.ceil((Date.now() - memberDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    } catch (e) {
      formattedMemberSince = memberSince;
    }
  }

  // Preparar dados do template
  const templateData = {
    customerName: customerName.split(' ')[0], // Primeiro nome
    customerFullName: customerName,
    customerEmail,
    
    // Dados da assinatura
    subscriptionId: event.subscription_id || event.id || 'N/A',
    renewalId: event.renewal_id || event.transaction_id || 'N/A',
    
    // Dados do plano
    plan: event.plan || {},
    planName: event.plan?.name || event.plan_name || 'Sua Assinatura',
    planAmount: event.plan?.amount || event.amount || event.price || 'N/A',
    billingPeriod: event.plan?.billing_period || event.billing_period || 'monthly',
    billingCycle: event.plan?.billing_cycle || event.billing_cycle || 'MONTHLY',
    
    // Datas importantes
    renewalDate: formattedRenewalDate,
    nextRenewalDate: formattedNextRenewalDate,
    memberSince: formattedMemberSince,
    daysUntilNextRenewal,
    membershipMonths,
    
    // Produto/Plataforma
    product: event.product || {},
    productName: event.product?.name || event.product_name || '',
    platformUrl: event.product?.platform_url || event.platform_url || event.access_url || '#',
    
    // Estatísticas de progresso
    stats: event.stats || {},
    completedLessons: event.stats?.completed_lessons || event.completed_lessons || 0,
    certificatesEarned: event.stats?.certificates_earned || event.certificates_earned || 0,
    hoursWatched: event.stats?.hours_watched || event.hours_watched || 0,
    hasStats: !!(event.stats || event.completed_lessons || event.hours_watched),
    
    // Benefícios e atualizações
    benefits: event.benefits || {},
    monthlyUpdates: event.benefits?.monthly_updates || event.monthly_updates || [],
    hasMonthlyUpdates: Array.isArray(event.benefits?.monthly_updates || event.monthly_updates),
    
    // Desconto de fidelidade
    loyaltyDiscount: event.benefits?.loyalty_discount || event.loyalty_discount || {},
    hasLoyaltyDiscount: !!(event.benefits?.loyalty_discount || event.loyalty_discount),
    loyaltyPercent: event.benefits?.loyalty_discount?.percent || event.loyalty_discount?.percent || 0,
    loyaltyMonths: event.benefits?.loyalty_discount?.months || event.loyalty_discount?.months || 0,
    
    // Bônus exclusivos
    exclusiveBonus: event.benefits?.exclusive_bonus || event.exclusive_bonus || {},
    hasExclusiveBonus: !!(event.benefits?.exclusive_bonus || event.exclusive_bonus),
    bonusName: event.benefits?.exclusive_bonus?.name || event.exclusive_bonus?.name || '',
    bonusDescription: event.benefits?.exclusive_bonus?.description || event.exclusive_bonus?.description || '',
    
    // Comunidade
    community: event.community || {},
    hasCommunity: !!(event.community?.discord_url || event.community?.telegram_url || event.community?.facebook_group_url),
    discordUrl: event.community?.discord_url || '',
    telegramUrl: event.community?.telegram_url || '',
    facebookGroupUrl: event.community?.facebook_group_url || '',
    membersCount: event.community?.members_count || 0,
    
    // URLs importantes
    supportUrl: event.support_url || 'https://suporte.empresa.com',
    accountUrl: event.account_url || event.platform_url || '#',
    helpUrl: event.help_url || event.support_url || '#',
    
    // Organização
    organizationName: organization.name,
    organizationEmail: (organization.emailSettings as any)?.fromEmail || 'noreply@empresa.com',
    
    // Estados baseados no perfil
    isLongTermMember: membershipMonths >= 12,
    isVipMember: membershipMonths >= 24,
    isNewlyRenewed: true,
    
    // Período de cobrança
    isMonthlyBilling: (event.plan?.billing_period || event.billing_period || 'monthly') === 'monthly',
    isQuarterlyBilling: (event.plan?.billing_period || event.billing_period) === 'quarterly',
    isYearlyBilling: (event.plan?.billing_period || event.billing_period || 'monthly') === 'yearly',
    
    // Savings calculation (for yearly plans)
    monthlySavings: event.plan?.billing_period === 'yearly' ? Math.round(parseFloat(event.plan?.amount?.replace(/[^\d,]/g, '').replace(',', '.') || '0') * 0.2) : 0,
    
    // Próximo ciclo
    nextBillingCycle: daysUntilNextRenewal <= 35 ? 'próximo mês' : 
                     daysUntilNextRenewal <= 100 ? 'próximo trimestre' : 'próximo ano',
    
    // Conquistas baseadas no tempo
    achievementUnlocked: membershipMonths === 12 ? '1 ano de membro!' :
                        membershipMonths === 24 ? '2 anos de fidelidade!' :
                        membershipMonths % 12 === 0 ? `${membershipMonths/12} anos conosco!` : '',
    hasAchievement: membershipMonths === 12 || membershipMonths === 24 || (membershipMonths % 12 === 0 && membershipMonths > 0),
    
    // Call-to-action
    ctaText: 'ACESSAR PLATAFORMA',
    
    // Dados de cobrança
    renewalAmount: event.plan?.amount || event.amount || event.price || '',
    paymentMethod: event.payment_method || 'Cartão de Crédito',
    invoiceUrl: event.invoice_url || event.receipt_url || '',
    hasInvoice: !!(event.invoice_url || event.receipt_url),
    
    // Dados adicionais
    utm: event.utm || {},
    customerId: event.customer_id || event.customer?.id || '',
    
    // Status
    subscriptionStatus: 'ACTIVE',
    billingStatus: 'PAID',
    
    // Agradecimento personalizado
    thankYouMessage: membershipMonths >= 24 ? 'Obrigado por ser um membro VIP!' :
                    membershipMonths >= 12 ? 'Obrigado por sua fidelidade!' :
                    'Obrigado por continuar conosco!',
    
    // Data e hora
    renewalTime: new Date().toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
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

    logger.info('Subscription renewed email sent successfully', {
      eventId,
      attemptNumber,
      emailId,
      planName: templateData.planName,
      membershipMonths
    });
  } catch (error) {
    logger.error('Failed to send subscription renewed email', {
      eventId,
      attemptNumber,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
