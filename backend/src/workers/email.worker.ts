import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '../utils/logger';
import { EmailJobData } from '../services/queue.service';
import { prisma } from '../config/database';
import { sendEmail } from '../services/email.service';
import { getEmailTemplate } from '../utils/email.templates';
import { env, getRedisConfig } from '../config/env';

// Configuração do Redis
const redisUrl = getRedisConfig();
const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: redisUrl.startsWith('rediss://') ? {} : undefined,
  family: 4,
});

// Worker de processamento de emails
const emailWorker = new Worker<EmailJobData>(
  'email-queue',
  async (job: Job<EmailJobData>) => {
    const { eventId, organizationId, eventType, payload, attemptNumber } = job.data;

    logger.info('Processing email job', {
      jobId: job.id,
      eventId,
      eventType,
      attemptNumber,
    });

    // Declarar template fora do try-catch
    let template;

    try {
      // Buscar evento do banco
      const event = await prisma.webhookEvent.findUnique({
        where: { id: eventId },
        include: { organization: true },
      });

      if (!event) {
        throw new Error('Event not found');
      }

      // Determinar template baseado no tipo de evento e tentativa
      template = getEmailTemplate(eventType, attemptNumber);
      
      if (!template) {
        logger.warn('No template found for event', { eventType, attemptNumber });
        return;
      }

      // Preparar dados do email
      const emailData = {
        to: payload.customer.email,
        subject: template.subject,
        template: template.templateName,
        data: {
          customerName: payload.customer.name,
          customerEmail: payload.customer.email,
          checkoutUrl: payload.checkout_url,
          totalPrice: payload.total_price,
          products: payload.products,
          organizationName: event.organization.name,
          domain: event.organization.domain || 'example.com',
          attemptNumber,
        },
        organizationId,
        eventId,
        attemptNumber,
      };

      // Enviar email
      const emailId = await sendEmail(emailData);
      
      logger.info('Email sent successfully', {
        jobId: job.id,
        emailId,
        to: emailData.to,
      });

      return { success: true, emailId };

    } catch (error) {
      logger.error('Failed to process email job', {
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Registrar falha no banco
      await prisma.emailLog.create({
        data: {
          organizationId,
          eventId,
          to: payload.customer.email,
          subject: template?.subject || 'Failed to send',
          template: template?.templateName || 'unknown',
          status: 'FAILED',
          attemptNumber,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }).catch((err) => {
        logger.error('Failed to log email failure', err);
      });

      throw error;
    }
  },
  {
    connection,
    concurrency: 5,
    autorun: true,
  }
);

// Eventos do worker
emailWorker.on('completed', (job) => {
  logger.info('Worker completed job', { jobId: job.id });
});

emailWorker.on('failed', (job, err) => {
  logger.error('Worker failed job', { 
    jobId: job?.id, 
    error: err.message 
  });
});

emailWorker.on('error', (err) => {
  logger.error('Worker error', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await emailWorker.close();
  connection.disconnect();
});

export { emailWorker }; 