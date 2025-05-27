import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { getRedisConfig } from '../config/env';
import { logger } from '../utils/logger';
import { WebhookEvent as PrismaWebhookEvent } from '@prisma/client';
import { WebhookEvent } from '../types/webhook.types';

// Configuração do Redis com suporte a Upstash
const redisUrl = getRedisConfig();
const redisOptions: any = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  family: 4,
};

// Configurações específicas para Upstash
if (redisUrl.startsWith('rediss://')) {
  redisOptions.tls = {};
}

const connection = new IORedis(redisUrl, redisOptions);

// Fila principal de emails
export const emailQueue = new Queue('email-queue', {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Eventos da fila
export const emailQueueEvents = new QueueEvents('email-queue', { connection });

// Tipo para os jobs de email
export interface EmailJobData {
  eventId: string;
  organizationId: string;
  eventType: string;
  payload: WebhookEvent;
  attemptNumber: number;
}

// Mapeamento de delays por tipo de evento
const EVENT_DELAYS: Record<string, number[]> = {
  ABANDONED_CART: [
    2 * 60 * 60 * 1000,    // 2 horas
    24 * 60 * 60 * 1000,   // 24 horas
    72 * 60 * 60 * 1000,   // 72 horas
  ],
  BANK_SLIP_EXPIRED: [
    30 * 60 * 1000,        // 30 minutos
    24 * 60 * 60 * 1000,   // 24 horas
    48 * 60 * 60 * 1000,   // 48 horas
  ],
  PIX_EXPIRED: [
    15 * 60 * 1000,        // 15 minutos
    2 * 60 * 60 * 1000,    // 2 horas
  ],
  SALE_REFUSED: [
    30 * 60 * 1000,        // 30 minutos
    4 * 60 * 60 * 1000,    // 4 horas
  ],
  SALE_APPROVED: [
    0,                     // Imediato
  ],
  SALE_CHARGEBACK: [
    0,                     // Imediato
  ],
  SALE_REFUNDED: [
    0,                     // Imediato
  ],
  BANK_SLIP_GENERATED: [
    24 * 60 * 60 * 1000,   // 24 horas (lembrete)
    48 * 60 * 60 * 1000,   // 48 horas (último dia)
  ],
  PIX_GENERATED: [
    30 * 60 * 1000,        // 30 minutos
  ],
  SUBSCRIPTION_CANCELED: [
    0,                     // Imediato (confirmação)
    7 * 24 * 60 * 60 * 1000,  // 7 dias (win-back)
    30 * 24 * 60 * 60 * 1000, // 30 dias (última tentativa)
  ],
  SUBSCRIPTION_EXPIRED: [
    0,                     // Imediato
    3 * 24 * 60 * 60 * 1000,  // 3 dias
  ],
  SUBSCRIPTION_RENEWED: [
    0,                     // Imediato
  ],
};

// Função para adicionar jobs à fila
export async function enqueueEmailJob(event: PrismaWebhookEvent, forceImmediate = false): Promise<void> {
  const delays = forceImmediate ? [0] : (EVENT_DELAYS[event.eventType] || [0]);
  const payload = event.payload as unknown as WebhookEvent;

  for (let i = 0; i < delays.length; i++) {
    const jobData: EmailJobData = {
      eventId: event.id,
      organizationId: event.organizationId,
      eventType: event.eventType,
      payload,
      attemptNumber: i + 1,
    };

    // Adicionar um ID único para evitar duplicatas
    const jobId = `${event.id}-attempt-${i + 1}`;

    await emailQueue.add('send-email', jobData, {
      jobId,
      delay: delays[i] || 0,
    });

    logger.info('Email job enqueued', {
      jobId,
      eventId: event.id,
      eventType: event.eventType,
      attemptNumber: i + 1,
      delay: delays[i],
      forceImmediate,
    });
  }
}

// Eventos da fila
emailQueueEvents.on('waiting', ({ jobId }) => {
  logger.debug('Job waiting', { jobId });
});

emailQueueEvents.on('active', ({ jobId, prev }) => {
  logger.info('Job active', { jobId, previousState: prev });
});

emailQueueEvents.on('completed', ({ jobId, returnvalue }) => {
  logger.info('Job completed', { jobId, result: returnvalue });
});

emailQueueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error('Job failed', { jobId, reason: failedReason });
});

emailQueueEvents.on('error', (error) => {
  logger.error('Queue error', error);
});

// Função para limpar jobs antigos
export async function cleanOldJobs(): Promise<void> {
  const jobs = await emailQueue.clean(
    24 * 60 * 60 * 1000, // 24 horas
    100,
    'completed'
  );
  
  logger.info(`Cleaned ${jobs.length} completed jobs`);
}

// Função para obter estatísticas da fila
export async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getCompletedCount(),
    emailQueue.getFailedCount(),
    emailQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
}

// Fechar conexão ao encerrar
process.on('SIGTERM', async () => {
  await emailQueue.close();
  connection.disconnect();
}); 