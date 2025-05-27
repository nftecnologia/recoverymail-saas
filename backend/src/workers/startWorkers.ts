import { logger } from '../utils/logger';
import { getRedisConfig } from '../config/env';
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { EmailJobData } from '../services/queue.service';
import { prisma } from '../config/database';
import { sendEmail } from '../services/email.service';
import { getEmailTemplate } from '../utils/email.templates';

// Função para processar email (copiada do email.worker.ts)
async function processEmailJob(job: Job<EmailJobData>) {
  const { eventId, organizationId, eventType, payload, attemptNumber } = job.data;

  logger.info('Processing email job', {
    jobId: job.id,
    eventId,
    eventType,
    attemptNumber,
  });

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
    const template = getEmailTemplate(eventType, attemptNumber);
    
    if (!template) {
      logger.warn('No template found for event', { eventType, attemptNumber });
      return { skipped: true, reason: 'No template for this attempt' };
    }

    // Extrair dados do payload
    const payloadData = (payload as any).data || payload || {};
    const customerData = payloadData.customer || {};
    const customerEmail = customerData.email;
    
    if (!customerEmail) {
      throw new Error('Customer email not found in payload');
    }

    // Preparar dados do email (versão simplificada)
    const emailData = {
      to: customerEmail,
      subject: template.subject.replace('{customerName}', customerData.name || 'Cliente'),
      template: template.templateName,
      data: {
        customerName: customerData.name || 'Cliente',
        customerEmail: customerEmail,
        organizationName: event.organization.name,
        domain: event.organization.domain || 'example.com',
        checkoutUrl: payloadData.checkout_url || '#',
        totalPrice: payloadData.total_price || 'R$ 0,00',
        products: payloadData.products || [],
        // Adicionar mais campos conforme necessário
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

    // Atualizar status do evento
    await prisma.webhookEvent.update({
      where: { id: eventId },
      data: {
        status: 'PROCESSED',
        processedAt: new Date(),
      },
    });

    return { success: true, emailId };

  } catch (error) {
    logger.error('Failed to process email job', {
      jobId: job.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// Função para inicializar workers
export async function startWorkers(): Promise<void> {
  logger.info('🚀 Starting workers initialization...');
  
  try {
    // Configurar Redis
    const redisUrl = getRedisConfig();
    if (!redisUrl) {
      logger.error('Redis URL not configured!');
      throw new Error('REDIS_URL not configured');
    }
    
    logger.info('🔧 Redis URL configured, creating connection...');
    
    const redisOptions: any = {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      family: 4,
    };

    if (redisUrl.startsWith('rediss://')) {
      redisOptions.tls = {};
    }

    const connection = new IORedis(redisUrl, redisOptions);
    
    // Teste de conexão
    await connection.ping();
    logger.info('✅ Redis connection successful');

    // Criar worker real
    const emailWorker = new Worker<EmailJobData>(
      'email-queue',
      processEmailJob,
      {
        connection,
        concurrency: 3,
        autorun: true,
      }
    );

    emailWorker.on('ready', () => {
      logger.info('✅ Email worker is ready and running');
    });

    emailWorker.on('completed', (job) => {
      logger.info('✅ Job completed', { jobId: job.id });
    });

    emailWorker.on('failed', (job, err) => {
      logger.error('❌ Job failed', { 
        jobId: job?.id, 
        error: err.message 
      });
    });

    emailWorker.on('error', (err) => {
      logger.error('❌ Worker error', err);
    });

    logger.info('✅ Workers initialization complete');
    
    // Manter referência global para evitar garbage collection
    (global as any).__workers = { emailWorker };
    
  } catch (error) {
    logger.error('❌ Failed to start workers', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

// Auto-executar se for importado
if (require.main !== module) {
  startWorkers().catch(err => {
    logger.error('Failed to auto-start workers', err);
  });
} 