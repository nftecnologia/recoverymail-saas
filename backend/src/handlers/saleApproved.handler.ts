import { logger } from '../utils/logger';
import { sendEmail } from '../services/email.service';
import { prisma } from '../config/database';
import { getEmailTemplate } from '../utils/email.templates';
import { EmailJobData } from '../services/trigger.service';

export async function processSaleApproved(data: EmailJobData): Promise<void> {
  const { eventId, organizationId, payload, attemptNumber } = data;
  const event = payload as any;

  logger.info('Processing sale approved email', {
    eventId,
    attemptNumber,
    transactionId: event.transaction_id || event.order_id,
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
  const template = getEmailTemplate('SALE_APPROVED', attemptNumber);
  if (!template) {
    throw new Error(`No template found for SALE_APPROVED attempt ${attemptNumber}`);
  }

  // Preparar dados do template
  const templateData = {
    customerName: customerName.split(' ')[0], // Primeiro nome
    customerFullName: customerName,
    customerEmail,
    
    // Dados da transação
    transactionId: event.transaction_id || event.order_id || 'N/A',
    orderNumber: event.order_number || event.transaction_id || 'N/A',
    totalPrice: event.total_price || event.amount || 'N/A',
    paymentMethod: event.payment_method || 'N/A',
    installments: event.installments || 1,
    
    // Dados do produto
    productName: event.product?.name || event.products?.[0]?.name || event.product_name || 'seu produto',
    productId: event.product?.id || event.product_id || '',
    offerName: event.product?.offer_name || event.offer_name || '',
    products: event.products || [],
    
    // Dados de acesso (se disponível)
    hasAccess: !!(event.access || event.platform_url || event.access_url),
    platformUrl: event.access?.platform_url || event.platform_url || event.access_url || '#',
    accessEmail: event.access?.email || customerEmail,
    accessPassword: event.access?.password || '',
    hasTemporaryPassword: event.access?.temporary_password || false,
    
    // Bônus inclusos
    bonuses: event.bonuses || [],
    hasBonuses: Array.isArray(event.bonuses) && event.bonuses.length > 0,
    
    // Comunidade/grupos
    community: event.community || {},
    hasCommunity: !!(event.community?.discord_url || event.community?.telegram_url || event.community?.facebook_group_url),
    discordUrl: event.community?.discord_url || '',
    telegramUrl: event.community?.telegram_url || '',
    facebookGroupUrl: event.community?.facebook_group_url || '',
    membersCount: event.community?.members_count || 0,
    
    // URLs importantes
    supportUrl: event.support_url || 'https://suporte.empresa.com',
    helpUrl: event.help_url || event.support_url || 'https://ajuda.empresa.com',
    
    // Organização
    organizationName: organization.name,
    organizationEmail: (organization.emailSettings as any)?.fromEmail || 'noreply@empresa.com',
    
    // Dados de entrega/fulfillment
    isDigitalProduct: !!(event.access || event.platform_url || event.download_url),
    isPhysicalProduct: !!(event.shipping || event.tracking_code),
    downloadUrl: event.download_url || '',
    trackingCode: event.tracking_code || '',
    shippingInfo: event.shipping || {},
    
    // Próximos passos
    nextSteps: event.next_steps || [],
    hasNextSteps: Array.isArray(event.next_steps) && event.next_steps.length > 0,
    
    // Data de compra
    purchaseDate: new Date().toLocaleDateString('pt-BR'),
    purchaseTime: new Date().toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    
    // Dados adicionais
    utm: event.utm || {},
    affiliate: event.affiliate || {},
    
    // Status
    paymentStatus: 'APROVADO',
    orderStatus: 'CONFIRMADO'
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

    logger.info('Sale approved email sent successfully', {
      eventId,
      attemptNumber,
      emailId,
      orderNumber: templateData.orderNumber
    });
  } catch (error) {
    logger.error('Failed to send sale approved email', {
      eventId,
      attemptNumber,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
