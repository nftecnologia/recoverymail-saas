import { Job } from 'bullmq';
import { EmailJobData } from '../services/queue.service';
import { logger } from '../utils/logger';

export async function processPixExpired(job: Job<EmailJobData>): Promise<void> {
  const { eventId, attemptNumber } = job.data;
  
  logger.info('Processing PIX expired email', {
    eventId,
    attemptNumber,
  });

  // TODO: Implementar lógica de envio de email
  logger.warn('PIX expired handler not implemented yet');
} 