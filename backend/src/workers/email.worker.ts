import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '../utils/logger';
import { EmailJobData } from '../services/queue.service';
import { prisma } from '../config/database';
import { sendEmail } from '../services/email.service';
import { getEmailTemplate } from '../utils/email.templates';
import { getRedisConfig } from '../config/env';

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

const connection = new IORedis(redisUrl, redisOptions);

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
    let customerEmail = 'unknown';

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

      // Extrair dados do payload de forma segura
      const payloadData = (payload as any).data || payload || {};
      const customer = payloadData.customer || {};
      customerEmail = customer.email || 'unknown';
      
      // Preparar dados base do email
      let emailData: any = {
        to: customerEmail,
        subject: template.subject.replace('{customerName}', customer.name || 'Cliente'),
        template: template.templateName,
        data: {
          customerName: customer.name || 'Cliente',
          customerEmail: customerEmail,
          organizationName: event.organization.name,
          domain: event.organization.domain || 'example.com',
          attemptNumber,
          // Valores padrão para evitar erros
          checkoutUrl: '#',
          totalPrice: 'R$ 0,00',
          productName: 'Produto',
          products: [],
          productPrice: 'R$ 0,00',
          discountPercent: 0,
          expirationDate: new Date().toISOString(),
          pixDiscount: 10,
          orderNumber: eventId,
          totalAmount: 'R$ 0,00',
          paymentMethod: 'Cartão',
          platformUrl: 'https://plataforma.example.com',
          temporaryPassword: 'senha123',
          bonuses: [],
          communityMembers: 5000,
          productBenefit: 'alcançar seus objetivos',
          totalModules: 12,
          communityUrl: '#',
          telegramUrl: '#',
          facebookGroupUrl: '#',
          hasMobileApp: false,
          organizationCNPJ: '00.000.000/0001-00',
          termsUrl: `https://${event.organization.domain}/termos`,
          privacyUrl: `https://${event.organization.domain}/privacidade`,
          refusalReason: 'Pagamento não autorizado',
          hoursAgo: 2,
          supportCode: `SUP${eventId.slice(-6).toUpperCase()}`,
          testimonial1: 'Maria Silva',
          testimonial2: 'João Santos',
          testimonial3: 'Ana Costa',
          totalStudents: 10000,
          phoneNumber: '0800-123-4567',
          chatUrl: 'https://chat.example.com',
          financeEmail: 'financeiro@example.com',
          purchaseDate: new Date().toISOString(),
          purchaseAmount: 'R$ 0,00',
          chargebackId: eventId,
          daysRemaining: 7,
          billingDescriptor: event.organization.name,
          cardLastDigits: '****',
          transactionId: eventId,
          cancelChargebackUrl: `https://${event.organization.domain}/resolver-chargeback`,
          resolveChargebackUrl: `https://${event.organization.domain}/resolver-chargeback`,
          refundAmount: 'R$ 0,00',
          refundDate: new Date().toISOString(),
          refundProtocol: eventId,
          feedbackUrl: `https://${event.organization.domain}/feedback`,
          specialCode: eventId.slice(-4).toUpperCase(),
          refundReceiptUrl: `https://${event.organization.domain}/comprovante/${eventId}`,
          bankSlipUrl: '#',
          barCode: '00000.00000 00000.000000 00000.000000 0 00000000000000',
          dueDate: new Date().toISOString(),
          qrCode: '',
          qrCodeUrl: '#',
          expiresAt: new Date().toISOString(),
          planName: 'Plano',
          billingPeriod: 'Mensal',
          renewalAmount: 'R$ 97,00',
          nextRenewalDate: new Date().toISOString(),
          renewalProtocol: eventId,
          completedLessons: 0,
          certificatesEarned: 0,
          hoursWatched: 0,
          membershipMonths: 1,
          monthlyUpdates: [],
          loyaltyDiscount: false,
          loyaltyDiscountPercent: 0,
          hasExclusiveBonus: false,
          exclusiveBonusName: '',
          subscriptionManagementUrl: `https://${event.organization.domain}/assinatura`,
          unsubscribeUrl: `https://${event.organization.domain}/cancelar-assinatura`,
          cancelReason: 'Não informado',
          totalPaid: 'R$ 0,00',
          lastPaymentDate: new Date().toISOString(),
          usagePercentage: 0,
          usedBenefits: [],
          unusedBenefits: [],
          mostAccessedFeature: 'Aulas',
          totalLogins: 0,
          lastLoginDate: new Date().toISOString(),
          postsCreated: 0,
          comments: 0,
          likesReceived: 0,
          connectionsMade: 0,
          expiredAt: new Date().toISOString(),
          renewalUrl: `https://${event.organization.domain}/renovar`,
        },
        organizationId,
        eventId,
        attemptNumber,
      };

      // Sobrescrever com dados específicos do evento se existirem
      switch (eventType) {
        case 'ABANDONED_CART':
          if (payloadData.checkout_url) emailData.data.checkoutUrl = payloadData.checkout_url;
          if (payloadData.total_price) emailData.data.totalPrice = payloadData.total_price;
          if (payloadData.items) {
            emailData.data.products = payloadData.items;
            if (payloadData.items[0]) {
              emailData.data.productName = payloadData.items[0].name || 'Produto';
              emailData.data.productPrice = payloadData.items[0].price || 'R$ 0,00';
            }
          }
          if (attemptNumber === 3) emailData.data.discountPercent = 10;
          break;

        case 'BANK_SLIP_EXPIRED':
        case 'PIX_EXPIRED':
          if (payloadData.amount) emailData.data.totalPrice = payloadData.amount;
          if (payloadData.expired_at) emailData.data.expirationDate = payloadData.expired_at;
          if (payloadData.original_due_date) emailData.data.expirationDate = payloadData.original_due_date;
          break;

        case 'SALE_APPROVED':
          if (payloadData.order_id) emailData.data.orderNumber = payloadData.order_id;
          if (payloadData.amount) emailData.data.totalAmount = payloadData.amount;
          if (payloadData.items && payloadData.items[0]) {
            emailData.data.productName = payloadData.items[0].name || 'Produto';
          }
          break;

        case 'SUBSCRIPTION_RENEWED':
          if (payloadData.plan) {
            emailData.data.planName = payloadData.plan.name || 'Plano';
            emailData.data.renewalAmount = payloadData.plan.price || 'R$ 97,00';
          }
          if (payloadData.next_renewal_date) emailData.data.nextRenewalDate = payloadData.next_renewal_date;
          if (payloadData.renewal_id) emailData.data.renewalProtocol = payloadData.renewal_id;
          break;

        // Adicionar outros casos conforme necessário
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
          to: customerEmail,
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