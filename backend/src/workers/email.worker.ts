import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '../utils/logger';
import { EmailJobData } from '../services/queue.service';
import { prisma } from '../config/database';
import { sendEmail } from '../services/email.service';
import { getEmailTemplate } from '../utils/email.templates';
import { env, getRedisConfig } from '../config/env';
import { WebhookEvent } from '../types/webhook.types';

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

      // Extrair dados do cliente de forma segura
      const customerData = (payload as any).data?.customer || (payload as any).customer || {};
      
      // Preparar dados base do email
      let emailData: any = {
        to: customerData.email,
        subject: template.subject.replace('{customerName}', customerData.name || 'Cliente'),
        template: template.templateName,
        data: {
          customerName: customerData.name || 'Cliente',
          customerEmail: customerData.email,
          organizationName: event.organization.name,
          domain: event.organization.domain || 'example.com',
          attemptNumber,
        },
        organizationId,
        eventId,
        attemptNumber,
      };

      // Adicionar dados específicos por tipo de evento
      const eventData = (payload as any).data || {};
      
      switch (eventType) {
        case 'ABANDONED_CART':
          emailData.data = {
            ...emailData.data,
            checkoutUrl: eventData.checkout_url || '#',
            totalPrice: eventData.total_price || 'R$ 0,00',
            products: eventData.items || [],
            productName: eventData.items?.[0]?.name || 'Produto',
            productPrice: eventData.items?.[0]?.price || 'R$ 0,00',
            discountPercent: attemptNumber === 3 ? 10 : 0,
          };
          break;

        case 'BANK_SLIP_EXPIRED':
        case 'PIX_EXPIRED':
          emailData.data = {
            ...emailData.data,
            checkoutUrl: '#',
            totalPrice: eventData.amount || 'R$ 0,00',
            productName: 'Produto',
            expirationDate: eventData.expired_at || eventData.original_due_date || new Date().toISOString(),
            pixDiscount: 10,
          };
          break;

        case 'SUBSCRIPTION_RENEWED':
          emailData.data = {
            ...emailData.data,
            productName: eventData.product?.name || 'Assinatura',
            planName: eventData.plan?.name || 'Plano Mensal',
            billingPeriod: 'Mensal',
            renewalAmount: eventData.plan?.price || 'R$ 97,00',
            nextRenewalDate: eventData.next_renewal_date || new Date().toISOString(),
            renewalProtocol: eventData.renewal_id || eventId,
            platformUrl: 'https://plataforma.example.com',
            completedLessons: eventData.stats?.completed_lessons || 0,
            certificatesEarned: eventData.stats?.certificates_earned || 0,
            hoursWatched: eventData.stats?.hours_watched || 0,
            membershipMonths: eventData.stats?.membership_months || 1,
            monthlyUpdates: eventData.benefits?.monthly_updates || [],
            loyaltyDiscount: false,
            loyaltyDiscountPercent: 0,
            hasExclusiveBonus: false,
            exclusiveBonusName: '',
            communityMembers: eventData.community?.members_count || 5000,
            communityUrl: '#',
            telegramUrl: '#',
            facebookGroupUrl: '#',
            subscriptionManagementUrl: `https://${event.organization.domain}/assinatura`,
            organizationCNPJ: '00.000.000/0001-00',
            termsUrl: `https://${event.organization.domain}/termos`,
            privacyUrl: `https://${event.organization.domain}/privacidade`,
            unsubscribeUrl: `https://${event.organization.domain}/cancelar-assinatura`,
          };
          break;

        case 'SUBSCRIPTION_CANCELED':
          emailData.data = {
            ...emailData.data,
            productName: eventData.plan?.name || 'Assinatura',
            planName: eventData.plan?.name || 'Plano',
            cancelReason: eventData.reason || 'Não informado',
            membershipMonths: eventData.stats?.months_active || 1,
            totalPaid: eventData.stats?.total_paid || 'R$ 0,00',
            lastPaymentDate: eventData.stats?.last_payment_date || new Date().toISOString(),
            usagePercentage: eventData.stats?.usage_percentage || 0,
            usedBenefits: eventData.benefits?.used || [],
            unusedBenefits: eventData.benefits?.unused || [],
            mostAccessedFeature: eventData.benefits?.most_accessed_feature || 'Aulas',
            totalLogins: eventData.benefits?.total_logins || 0,
            lastLoginDate: eventData.benefits?.last_login_date || new Date().toISOString(),
            postsCreated: eventData.community?.posts_created || 0,
            comments: eventData.community?.comments || 0,
            likesReceived: eventData.community?.likes_received || 0,
            connectionsMade: eventData.community?.connections_made || 0,
          };
          break;

        default:
          // Dados genéricos para outros eventos
          emailData.data = {
            ...emailData.data,
            checkoutUrl: eventData.checkout_url || '#',
            totalPrice: eventData.amount || eventData.total_price || 'R$ 0,00',
            productName: eventData.product?.name || 'Produto',
          };
      }

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
          to: customerData.email || 'unknown',
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