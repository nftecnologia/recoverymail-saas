import { logger } from '../utils/logger';
import { sendEmail } from '../services/email.service';
import { prisma } from '../config/database';
import { getEmailTemplate } from '../utils/email.templates';
import { EmailJobData } from '../services/trigger.service';

export async function processPixGenerated(data: EmailJobData): Promise<void> {
  const { eventId, organizationId, payload, attemptNumber } = data;
  const event = payload as any;

  logger.info('Processing PIX generated email', {
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
  const template = getEmailTemplate('PIX_GENERATED', attemptNumber);
  if (!template) {
    throw new Error(`No template found for PIX_GENERATED attempt ${attemptNumber}`);
  }

  // Processar data de expiração
  const expiresAt = event.expires_at || event.expiration_date;
  let formattedExpiryTime = 'não informado';
  let minutesUntilExpiry = 30; // Default
  
  if (expiresAt) {
    try {
      const expiryDate = new Date(expiresAt);
      formattedExpiryTime = expiryDate.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      minutesUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60));
    } catch (e) {
      formattedExpiryTime = expiresAt;
    }
  }

  // Preparar dados do template
  const templateData = {
    customerName: customerName.split(' ')[0], // Primeiro nome
    customerEmail,
    
    // Dados da transação
    transactionId: event.transaction_id || event.order_id || 'N/A',
    orderNumber: event.order_number || event.transaction_id || 'N/A',
    totalPrice: event.total_price || event.amount || 'N/A',
    
    // Dados do PIX
    pixQrCode: event.pix_qr_code || event.qr_code || '',
    pixCopyPaste: event.pix_copy_paste || event.pix_code || event.emv || '',
    pixQrCodeImage: event.pix_qr_code_image || event.qr_code_image || '',
    expiresAt: formattedExpiryTime,
    minutesUntilExpiry,
    
    // Estado da expiração
    isExpiringSoon: minutesUntilExpiry <= 10,
    isLastMinutes: minutesUntilExpiry <= 5,
    hasExpired: minutesUntilExpiry <= 0,
    
    // Produtos
    products: event.products || [],
    productName: event.products?.[0]?.name || event.product_name || 'seu produto',
    
    // URLs importantes
    checkoutUrl: event.checkout_url || '#',
    supportUrl: event.support_url || 'https://suporte.empresa.com',
    paymentUrl: event.payment_url || event.checkout_url || '#',
    
    // Organização
    organizationName: organization.name,
    organizationEmail: (organization.emailSettings as any)?.fromEmail || 'noreply@empresa.com',
    
    // Controle de tentativas
    isFirstAttempt: attemptNumber === 1, // QR Code inicial
    isUrgentReminder: attemptNumber >= 2, // Lembretes urgentes
    isLastChance: attemptNumber >= 3,     // Última chance
    attemptNumber,
    
    // Instruções específicas por tentativa
    instructionType: attemptNumber === 1 ? 'initial' : 
                    attemptNumber === 2 ? 'urgent' : 'lastchance',
    
    // Benefícios do PIX
    pixBenefits: [
      'Pagamento instantâneo',
      'Aprovação na hora',
      'Acesso imediato',
      '100% seguro'
    ],
    
    // Dados de pagamento
    paymentMethod: 'PIX',
    paymentDetails: event.payment_details || {},
    expiresInMinutes: event.payment_details?.expires_in_minutes || minutesUntilExpiry,
    
    // Dados adicionais
    utm: event.utm || {},
    
    // Urgência baseada no tempo restante
    urgencyLevel: minutesUntilExpiry <= 5 ? 'critical' : 
                 minutesUntilExpiry <= 15 ? 'high' : 'medium',
    
    // Textos de call-to-action baseados na urgência
    ctaText: minutesUntilExpiry <= 5 ? 'PAGAR AGORA - ÚLTIMOS MINUTOS!' :
             minutesUntilExpiry <= 15 ? 'PAGAR COM PIX AGORA' :
             'PAGAR COM PIX INSTANTÂNEO',
    
    // Contador regressivo
    showCountdown: minutesUntilExpiry <= 30,
    countdownMinutes: Math.max(0, minutesUntilExpiry)
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

    logger.info('PIX generated email sent successfully', {
      eventId,
      attemptNumber,
      emailId,
      expiresAt: formattedExpiryTime,
      minutesUntilExpiry
    });
  } catch (error) {
    logger.error('Failed to send PIX generated email', {
      eventId,
      attemptNumber,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
