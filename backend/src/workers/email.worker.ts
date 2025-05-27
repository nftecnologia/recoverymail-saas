import { Worker, Job } from 'bullmq';
import { EmailJobData } from '../services/queue.service';
import { logger } from '../utils/logger';
import IORedis from 'ioredis';
import { getRedisConfig } from '../config/env';
import { processAbandonedCart } from '../handlers/abandonedCart.handler';
import { processBankSlipExpired } from '../handlers/bankSlipExpired.handler';
import { processPixExpired } from '../handlers/pixExpired.handler';
import { prisma } from '../config/database';

// Mapeamento de tipos de evento para handlers
const eventHandlers: Record<string, (job: Job<EmailJobData>) => Promise<void>> = {
  'ABANDONED_CART': processAbandonedCart,
  'BANK_SLIP_EXPIRED': processBankSlipExpired,
  'PIX_EXPIRED': processPixExpired,
};

// Configuração do Redis
const redisUrl = getRedisConfig();
const redisOptions: any = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  family: 4,
};

if (redisUrl.startsWith('rediss://')) {
  redisOptions.tls = {};
}

const redisConnection = new IORedis(redisUrl, redisOptions);

// Worker principal
export const emailWorker = new Worker(
  'email-queue',
  async (job: Job<EmailJobData>) => {
    const { eventId, attemptNumber } = job.data;
    
    logger.info('Processing email job', {
      jobId: job.id,
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

      // Buscar o handler apropriado
      const handler = eventHandlers[event.eventType];
      
      if (!handler) {
        logger.warn('No handler found for event type', { 
          eventType: event.eventType,
          eventId 
        });
        return;
      }

      // Executar o handler
      await handler(job);
      
      logger.info('Email job processed successfully', {
        jobId: job.id,
        eventId,
        attemptNumber,
      });
      
    } catch (error) {
      logger.error('Error processing email job', {
        error: error instanceof Error ? error.message : 'Unknown error',
        jobId: job.id,
        eventId,
        attemptNumber,
      });
      
      throw error; // Re-throw para o Bull tentar novamente
    }
  },
  {
    connection: redisConnection,
    concurrency: 3,
    removeOnComplete: {
      count: 100,
      age: 24 * 3600 // 24 horas
    },
    removeOnFail: {
      count: 50,
      age: 7 * 24 * 3600 // 7 dias
    }
  }
);

// Event listeners
emailWorker.on('completed', (job) => {
  logger.info('Email job completed', { 
    jobId: job.id,
    eventId: job.data.eventId,
    attemptNumber: job.data.attemptNumber
  });
});

emailWorker.on('failed', (job, err) => {
  logger.error('Email job failed', {
    jobId: job?.id,
    eventId: job?.data.eventId,
    attemptNumber: job?.data.attemptNumber,
    error: err.message,
  });
});

emailWorker.on('error', (err) => {
  logger.error('Email worker error', { error: err.message });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing email worker...');
  await emailWorker.close();
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing email worker...');
  await emailWorker.close();
}); 