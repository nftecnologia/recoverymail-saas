import { task } from "@trigger.dev/sdk/v3";
import { logger } from "../utils/logger";
import { EmailJobData } from "../services/trigger.service";

// Importar todos os handlers (usando os nomes corretos das funções)
import { processAbandonedCart } from "../handlers/abandonedCart.handler";
import { processBankSlipExpired } from "../handlers/bankSlipExpired.handler";
import { processPixExpired } from "../handlers/pixExpired.handler";
import { processSaleRefused } from "../handlers/saleRefused.handler";
import { processBankSlipGenerated } from "../handlers/bankSlipGenerated.handler";
import { processPixGenerated } from "../handlers/pixGenerated.handler";
import { processSubscriptionCanceled } from "../handlers/subscriptionCanceled.handler";
import { processSubscriptionExpired } from "../handlers/subscriptionExpired.handler";
import { processSaleApproved } from "../handlers/saleApproved.handler";
import { handleSaleChargeback } from "../handlers/saleChargeback.handler";
import { handleSaleRefunded } from "../handlers/saleRefunded.handler";
import { handleSubscriptionRenewed } from "../handlers/subscriptionRenewed.handler";

// Mapeamento de tipos de evento para handlers
const eventHandlers: Record<string, (data: EmailJobData) => Promise<void>> = {
  'ABANDONED_CART': async (data) => {
    const mockJob = { data } as any;
    await processAbandonedCart(mockJob);
  },
  'BANK_SLIP_EXPIRED': async (data) => {
    const mockJob = { data } as any;
    await processBankSlipExpired(mockJob);
  },
  'PIX_EXPIRED': async (data) => {
    const mockJob = { data } as any;
    await processPixExpired(mockJob);
  },
  'SALE_REFUSED': async (data) => {
    const mockJob = { data } as any;
    await processSaleRefused(mockJob);
  },
  'BANK_SLIP_GENERATED': async (data) => {
    const mockJob = { data } as any;
    await processBankSlipGenerated(mockJob);
  },
  'PIX_GENERATED': async (data) => {
    const mockJob = { data } as any;
    await processPixGenerated(mockJob);
  },
  'SUBSCRIPTION_CANCELED': async (data) => {
    const mockJob = { data } as any;
    await processSubscriptionCanceled(mockJob);
  },
  'SUBSCRIPTION_EXPIRED': async (data) => {
    const mockJob = { data } as any;
    await processSubscriptionExpired(mockJob);
  },
  'SALE_APPROVED': async (data) => {
    const mockJob = { data } as any;
    await processSaleApproved(mockJob);
  },
  'SALE_CHARGEBACK': async (data) => {
    await handleSaleChargeback(data.payload, data.eventId, data.organizationId, true);
  },
  'SALE_REFUNDED': async (data) => {
    await handleSaleRefunded(data.payload, data.eventId, data.organizationId, true);
  },
  'SUBSCRIPTION_RENEWED': async (data) => {
    await handleSubscriptionRenewed(data.payload, data.eventId, data.organizationId, true);
  },
};

// Task principal para processamento de emails
export const processEmailTask = task({
  id: "process-email",
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
    factor: 2,
  },
  run: async (payload: EmailJobData) => {
    const { eventId, organizationId, eventType, attemptNumber } = payload;
    
    logger.info('Processing email task', {
      eventId,
      organizationId,
      eventType,
      attemptNumber,
    });

    try {
      // Buscar o handler apropriado
      const handler = eventHandlers[eventType];
      
      if (!handler) {
        logger.warn('No handler found for event type', { 
          eventType,
          eventId 
        });
        return { success: false, reason: 'No handler found' };
      }

      // Executar o handler
      await handler(payload);
      
      logger.info('Email task processed successfully', {
        eventId,
        eventType,
        attemptNumber,
      });

      return { success: true, eventId, eventType };
      
    } catch (error) {
      logger.error('Error processing email task', {
        error: error instanceof Error ? error.message : 'Unknown error',
        eventId,
        eventType,
        attemptNumber,
      });
      
      throw error; // Re-throw para o Trigger.dev tentar novamente
    }
  },
});

// Tasks específicos para cada tipo de evento com delays
export const abandonedCartTask = task({
  id: "abandoned-cart-email",
  retry: { maxAttempts: 3 },
  run: async (payload: EmailJobData) => {
    return await processEmailTask.triggerAndWait(payload);
  },
});

export const pixExpiredTask = task({
  id: "pix-expired-email", 
  retry: { maxAttempts: 3 },
  run: async (payload: EmailJobData) => {
    return await processEmailTask.triggerAndWait(payload);
  },
});

export const bankSlipExpiredTask = task({
  id: "bank-slip-expired-email",
  retry: { maxAttempts: 3 },
  run: async (payload: EmailJobData) => {
    return await processEmailTask.triggerAndWait(payload);
  },
});

export const saleRefusedTask = task({
  id: "sale-refused-email",
  retry: { maxAttempts: 3 },
  run: async (payload: EmailJobData) => {
    return await processEmailTask.triggerAndWait(payload);
  },
});

// Função helper para agendar tarefas com delay
export async function scheduleEmailTask(data: EmailJobData, delayInMs: number = 0) {
  if (delayInMs > 0) {
    // Usar scheduleTask para delays (converter para Date)
    const delayDate = new Date(Date.now() + delayInMs);
    return await processEmailTask.trigger(data, {
      delay: delayDate,
    });
  } else {
    // Executar imediatamente
    return await processEmailTask.trigger(data);
  }
}