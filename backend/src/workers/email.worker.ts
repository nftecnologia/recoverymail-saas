import { Job } from 'bull';
import { emailQueue, EmailJobData } from '../services/queue.service';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { processAbandonedCart } from '../handlers/abandonedCart.handler';
import { processBankSlipExpired } from '../handlers/bankSlipExpired.handler';
import { processPixExpired } from '../handlers/pixExpired.handler';
import { processSaleRefused } from '../handlers/saleRefused.handler';

// Mapeamento de handlers por tipo de evento
const eventHandlers: Record<string, (job: Job<EmailJobData>) => Promise<void>> = {
  ABANDONED_CART: processAbandonedCart,
  BANK_SLIP_EXPIRED: processBankSlipExpired,
  PIX_EXPIRED: processPixExpired,
  SALE_REFUSED: processSaleRefused,
  // TODO: Adicionar outros handlers conforme implementados
};

// Processar jobs de email
emailQueue.process(async (job: Job<EmailJobData>) => {
  const { eventId, eventType, organizationId, payload, attemptNumber } = job.data;

  logger.info('Processing email job', {
    jobId: job.id,
    eventId,
    eventType,
    attemptNumber,
  });

  try {
    // Verificar se o evento ainda está pendente
    const event = await prisma.webhookEvent.findUnique({
      where: { id: eventId },
      include: {
        organization: true,
      },
    });

    if (!event) {
      logger.warn('Event not found', { eventId });
      return;
    }

    if (event.status === 'PROCESSED' && attemptNumber === 1) {
      logger.info('Event already processed', { eventId });
      return;
    }

    // Buscar handler específico do evento
    const handler = eventHandlers[eventType];
    
    if (!handler) {
      logger.error('No handler found for event type', { eventType });
      throw new Error(`No handler for event type: ${eventType}`);
    }

    // Executar handler
    await handler(job);

    // Atualizar status do evento (apenas no primeiro email)
    if (attemptNumber === 1) {
      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: {
          status: 'PROCESSING',
          processedAt: new Date(),
        },
      });
    }

    // Se for o último email da sequência, marcar como processado
    const totalEmails = getTotalEmailsForEvent(eventType);
    if (attemptNumber === totalEmails) {
      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: {
          status: 'PROCESSED',
          processedAt: new Date(),
        },
      });
    }

    logger.info('Email job processed successfully', {
      jobId: job.id,
      eventId,
      attemptNumber,
    });

  } catch (error) {
    logger.error('Failed to process email job', {
      jobId: job.id,
      eventId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Marcar evento como falho se for o último retry
    if (job.attemptsMade === job.opts.attempts) {
      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }

    throw error;
  }
});

// Função auxiliar para obter total de emails por evento
function getTotalEmailsForEvent(eventType: string): number {
  const emailCounts: Record<string, number> = {
    ABANDONED_CART: 3,
    BANK_SLIP_EXPIRED: 3,
    PIX_EXPIRED: 2,
    SALE_REFUSED: 2,
    SALE_APPROVED: 1,
    SALE_CHARGEBACK: 1,
    SALE_REFUNDED: 1,
    BANK_SLIP_GENERATED: 2,
    PIX_GENERATED: 1,
    SUBSCRIPTION_CANCELED: 3,
    SUBSCRIPTION_EXPIRED: 2,
    SUBSCRIPTION_RENEWED: 1,
  };

  return emailCounts[eventType] || 1;
}

logger.info('Email worker initialized'); 