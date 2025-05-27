import { Job } from 'bullmq';
import { EmailJobData } from '../services/queue.service';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { sendEmail } from '../services/email.service';
import { getEmailTemplate } from '../utils/email.templates';

export async function processPixExpired(job: Job<EmailJobData>): Promise<void> {
  const { eventId, attemptNumber } = job.data;
  
  logger.info('Processing PIX expired email', {
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
    const template = getEmailTemplate('PIX_EXPIRED', attemptNumber);
    if (!template) {
      logger.warn('No template found for attempt', { eventType: 'PIX_EXPIRED', attemptNumber });
      return;
    }

    // Extrair dados do payload
    const payload = event.payload as any;
    const customerEmail = payload.customer?.email;
    const customerName = payload.customer?.name || 'Cliente';
    
    if (!customerEmail) {
      throw new Error('Customer email not found in payload');
    }

    // Preparar dados para o template
    const emailData = {
      to: customerEmail,
      subject: template.subject,
      template: template.templateName,
      data: {
        customerName: customerName.split(' ')[0], // Primeiro nome
        pixId: payload.pix_id || payload.transaction_id,
        pixQrCode: payload.pix_qr_code || payload.qr_code,
        pixQrCodeImage: payload.pix_qr_code_image || payload.qr_code_image,
        pixCopyPaste: payload.pix_copy_paste || payload.pix_code,
        totalPrice: payload.total_price || payload.amount,
        expirationTime: payload.expiration_time || '30 minutos',
        products: payload.products || [],
        // URLs importantes
        checkoutUrl: payload.checkout_url || '#',
        newPixUrl: payload.new_pix_url || payload.checkout_url || '#',
        supportUrl: payload.support_url || 'https://suporte.exemplo.com',
        // Dados da organização
        organizationName: event.organization.name,
        organizationEmail: event.organization.emailSettings?.fromEmail || 'noreply@inboxrecovery.com',
        // Controle de tentativas
        isFirstAttempt: attemptNumber === 1,
        isLastAttempt: attemptNumber === 2, // PIX_EXPIRED tem 2 tentativas
        attemptNumber
      },
      organizationId: event.organizationId,
      eventId: event.id,
      attemptNumber
    };

    // Enviar email
    const emailId = await sendEmail(emailData);
    
    logger.info('PIX expired email sent successfully', {
      eventId,
      emailId,
      attemptNumber,
      to: customerEmail
    });

    // Se for a última tentativa, marcar evento como processado
    if (attemptNumber === 2) {
      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: {
          status: 'PROCESSED',
          processedAt: new Date(),
          metadata: {
            ...(event.metadata as any || {}),
            lastEmailSentAt: new Date().toISOString(),
            totalEmailsSent: attemptNumber
          }
        }
      });
      
      logger.info('PIX expired event marked as processed', { eventId });
    }

  } catch (error) {
    logger.error('Error processing PIX expired email', {
      error: error instanceof Error ? error.message : 'Unknown error',
      eventId,
      attemptNumber
    });
    
    // Re-throw para o Bull tentar novamente
    throw error;
  }
} 