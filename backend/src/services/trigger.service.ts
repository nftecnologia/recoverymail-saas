import { tasks } from "@trigger.dev/sdk/v3";
import { logger } from '../utils/logger';
import { WebhookEvent as PrismaWebhookEvent } from '@prisma/client';
import { WebhookEvent } from '../types/webhook.types';

// Reexportar interface para compatibilidade
export interface EmailJobData {
  eventId: string;
  organizationId: string;
  eventType: string;
  payload: WebhookEvent;
  attemptNumber: number;
}

// Mapeamento de delays por tipo de evento (mesmos do queue.service.ts)
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
    15 * 60 * 1000,        // 15 minutos (urgente!)
    2 * 60 * 60 * 1000,    // 2 horas
    24 * 60 * 60 * 1000,   // 24 horas (última chance)
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
    0,                     // Imediato (confirmação)
    24 * 60 * 60 * 1000,   // 24 horas (lembrete)
    48 * 60 * 60 * 1000,   // 48 horas (urgência)
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

// Função para adicionar jobs à fila (substitui enqueueEmailJob)
export async function enqueueEmailJob(event: PrismaWebhookEvent, forceImmediate = false): Promise<void> {
  const delays = forceImmediate ? [0] : (EVENT_DELAYS[event.eventType] || [0]);
  const payload = event.payload as unknown as WebhookEvent;

  // Modo de teste - simular processamento sem chamar Trigger.dev
  if (process.env['TEST_MODE'] === 'true') {
    logger.info('TEST MODE: Simulating email job processing', {
      eventId: event.id,
      eventType: event.eventType,
      totalJobs: delays.length,
      delays
    });
    return Promise.resolve();
  }

  for (let i = 0; i < delays.length; i++) {
    const jobData: EmailJobData = {
      eventId: event.id,
      organizationId: event.organizationId,
      eventType: event.eventType,
      payload,
      attemptNumber: i + 1,
    };

    try {
      // Usar Trigger.dev ao invés de BullMQ
      const delayMs = delays[i] || 0;
      const triggerOptions: any = {
        idempotencyKey: `${event.id}-attempt-${i + 1}`, // Evitar duplicatas
      };
      
      if (delayMs > 0) {
        triggerOptions.delay = new Date(Date.now() + delayMs);
      }
      
      const task = await tasks.trigger("process-email", jobData, triggerOptions);

      logger.info('Email task triggered', {
        taskId: task.id,
        eventId: event.id,
        eventType: event.eventType,
        attemptNumber: i + 1,
        delay: delays[i],
        forceImmediate,
      });
    } catch (error) {
      logger.error('Failed to trigger email task', {
        error: error instanceof Error ? error.message : 'Unknown error',
        eventId: event.id,
        eventType: event.eventType,
        attemptNumber: i + 1,
      });
      throw error;
    }
  }
}

// Função para obter estatísticas (compatibilidade com código existente)
export async function getQueueStats() {
  // Trigger.dev não expõe estatísticas da mesma forma que BullMQ
  // Retornar estatísticas básicas para compatibilidade
  return {
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
    delayed: 0,
    total: 0,
    note: 'Statistics not available with Trigger.dev - check dashboard at cloud.trigger.dev'
  };
}

// Função para limpeza (não necessária no Trigger.dev)
export async function cleanOldJobs(): Promise<void> {
  logger.info('Job cleanup not required with Trigger.dev - handled automatically');
}

// Função de compatibilidade (não usada mais)
export function getQueue() {
  throw new Error('getQueue() not available with Trigger.dev - use Trigger.dev dashboard');
}
