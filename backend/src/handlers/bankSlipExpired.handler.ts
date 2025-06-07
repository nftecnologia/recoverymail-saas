import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { sendEmail } from '../services/email.service';
import { getEmailTemplate } from '../utils/email.templates';
import { EmailJobData } from '../services/trigger.service';

export async function processBankSlipExpired(data: EmailJobData): Promise<void> {
  const { eventId, attemptNumber } = data;
  
  logger.info('Processing bank slip expired email', {
    eventId,
    attemptNumber,
  });

  try {
    // Buscar o evento do banco
    const event = await prisma.webhookEvent.findUnique({
      where: { id: eventId },
      include: { organization: true }
    });

    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    // Verificar se já foi processado
    if (event.status === 'PROCESSED') {
      logger.info('Event already processed', { eventId });
      return;
    }

    // Buscar template para esta tentativa
    const template = getEmailTemplate('BANK_SLIP_EXPIRED', attemptNumber);
    if (!template) {
      logger.warn('No template found for attempt', { eventType: 'BANK_SLIP_EXPIRED', attemptNumber });
      return;
    }

    // Extrair dados do payload
    const payload = event.payload as any;
    const customerEmail = payload.customer?.email;
    const customerName = payload.customer?.name || 'Cliente';
    
    if (!customerEmail) {
      throw new Error('Customer email not found in payload');
    }

    // Extrair emailSettings
    const emailSettings = event.organization.emailSettings as any;

    // Preparar dados para o template
    const emailData = {
      to: customerEmail,
      subject: template.subject,
      template: template.templateName,
      data: {
        customerName: customerName.split(' ')[0], // Primeiro nome
        // IDs e códigos do boleto
        transactionId: payload.transaction_id || payload.sale_id,
        bankSlipCode: payload.bank_slip_code || payload.payment?.digitable_line,
        bankSlipUrl: payload.bank_slip_url || payload.payment?.link,
        // Valores
        totalPrice: payload.total_price || payload.amount,
        // Datas
        expiredAt: payload.expired_at || payload.payment?.expires_at,
        dueDate: payload.due_date || payload.payment?.expires_at,
        // Produtos
        products: payload.products || [],
        productName: payload.products?.[0]?.name || 'seu produto',
        // URLs importantes
        checkoutUrl: payload.checkout_url || '#',
        newBankSlipUrl: payload.new_bank_slip_url || payload.checkout_url || '#',
        pixUrl: payload.pix_url || payload.checkout_url || '#',
        supportUrl: payload.support_url || 'https://suporte.exemplo.com',
        // Dados da organização
        organizationName: event.organization.name,
        organizationEmail: emailSettings?.fromEmail || 'noreply@inboxrecovery.com',
        // Controle de tentativas
        isFirstAttempt: attemptNumber === 1,
        isSecondAttempt: attemptNumber === 2,
        isThirdAttempt: attemptNumber === 3,
        isLastAttempt: attemptNumber === 3, // BANK_SLIP_EXPIRED tem 3 tentativas
        attemptNumber,
        // Ofertas especiais baseadas na tentativa
        hasDiscount: attemptNumber >= 2,
        discountPercent: attemptNumber === 2 ? 5 : attemptNumber === 3 ? 10 : 0,
        hasPix: attemptNumber >= 2, // Oferecer PIX como alternativa
        hasUrgency: attemptNumber >= 2,
        // Dados adicionais
        paymentMethod: payload.payment_method || 'Boleto',
        customerDocument: payload.customer?.document
      },
      organizationId: event.organizationId,
      eventId: event.id,
      attemptNumber
    };

    // Enviar email
    const emailId = await sendEmail(emailData);
    
    logger.info('Bank slip expired email sent successfully', {
      eventId,
      emailId,
      attemptNumber,
      to: customerEmail,
      template: template.templateName
    });

    // Se for a última tentativa, marcar evento como processado
    if (attemptNumber === 3) {
      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: {
          status: 'PROCESSED',
          processedAt: new Date()
        }
      });
      
      logger.info('Bank slip expired event marked as processed', { eventId });
    }

  } catch (error) {
    logger.error('Error processing bank slip expired email', {
      error: error instanceof Error ? error.message : 'Unknown error',
      eventId,
      attemptNumber
    });
    
    // Re-throw para o Bull tentar novamente
    throw error;
  }
}
