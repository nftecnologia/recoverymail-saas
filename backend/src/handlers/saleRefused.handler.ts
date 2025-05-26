import { Job } from 'bull';
import { EmailJobData } from '../services/queue.service';
import { logger } from '../utils/logger';

export async function processSaleRefused(job: Job<EmailJobData>): Promise<void> {
  const { eventId, attemptNumber } = job.data;
  
  logger.info('Processing sale refused email', {
    eventId,
    attemptNumber,
  });

  // TODO: Implementar lógica de envio de email
  logger.warn('Sale refused handler not implemented yet');
} 