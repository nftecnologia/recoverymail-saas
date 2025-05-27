import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '../utils/logger';
import { EmailJobData } from '../services/queue.service';
import { prisma } from '../config/database';
import { sendEmail } from '../services/email.service';
import { getEmailTemplate } from '../utils/email.templates';
import { getRedisConfig } from '../config/env';

// LOG DE DEBUG
logger.info('📧 Email worker module loading...');

// Configuração do Redis
const redisUrl = getRedisConfig();
logger.info('📧 Redis URL for worker:', redisUrl ? 'configured' : 'not configured');

const redisOptions: any = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  family: 4,
};

if (redisUrl.startsWith('rediss://')) {
  redisOptions.tls = {};
}

try {
  const connection = new IORedis(redisUrl, redisOptions);
  logger.info('📧 Redis connection created for worker');

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
        const customerData = payloadData.customer || {};
        customerEmail = customerData.email || 'unknown';
        
        // Preparar dados base do email
        let emailData: any = {
          to: customerEmail,
          subject: template.subject.replace('{customerName}', customerData.name || 'Cliente'),
          template: template.templateName,
          data: {
            customerName: customerData.name || 'Cliente',
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
          case 'SALE_CHARGEBACK':
            emailData.data.chargebackId = payloadData.chargeback_id || eventId;
            emailData.data.daysRemaining = payloadData.days_to_resolve || 7;
            emailData.data.billingDescriptor = payloadData.payment_details?.descriptor || event.organization.name;
            emailData.data.cardLastDigits = payloadData.payment_details?.last_digits || '****';
            emailData.data.transactionId = payloadData.transaction_id || eventId;
            emailData.data.cancelChargebackUrl = payloadData.resolution_url || `https://${event.organization.domain}/resolver-chargeback`;
            emailData.data.resolveChargebackUrl = payloadData.resolution_url || `https://${event.organization.domain}/resolver-chargeback`;
            emailData.data.phoneNumber = (event.organization.emailSettings as any)?.phoneNumber || '0800-123-4567';
            emailData.data.financeEmail = (event.organization.emailSettings as any)?.financeEmail || 'financeiro@example.com';
            break;

          case 'SALE_REFUNDED':
            emailData.data.productName = payloadData.product?.name || 'Produto';
            emailData.data.refundAmount = payloadData.refund_amount || 'R$ 0,00';
            emailData.data.refundMethod = payloadData.refund_method || 'Cartão de Crédito';
            emailData.data.refundDate = payloadData.refund_date || new Date().toISOString();
            emailData.data.refundProtocol = payloadData.refund_id || eventId;
            emailData.data.feedbackUrl = payloadData.feedback_url || `https://${event.organization.domain}/feedback`;
            emailData.data.specialCode = eventId.slice(-4).toUpperCase();
            emailData.data.organizationCNPJ = (event.organization.emailSettings as any)?.cnpj || '00.000.000/0001-00';
            emailData.data.financeEmail = (event.organization.emailSettings as any)?.financeEmail || 'financeiro@example.com';
            emailData.data.refundReceiptUrl = `https://${event.organization.domain}/comprovante/${payloadData.refund_id || eventId}`;
            break;

          case 'SUBSCRIPTION_RENEWED':
            emailData.data.productName = payloadData.product?.name || 'Assinatura';
            emailData.data.planName = payloadData.plan?.name || 'Plano';
            emailData.data.billingPeriod = payloadData.plan?.billing_period || 'Mensal';
            emailData.data.renewalAmount = payloadData.plan?.price || 'R$ 97,00';
            emailData.data.nextRenewalDate = payloadData.plan?.next_renewal_date || payloadData.next_renewal_date || new Date().toISOString();
            emailData.data.renewalProtocol = payloadData.renewal_id || eventId;
            emailData.data.productName = payloadData.product?.name || 'Assinatura';
            emailData.data.completedLessons = payloadData.stats?.completed_lessons || 0;
            emailData.data.certificatesEarned = payloadData.stats?.certificates_earned || 0;
            emailData.data.hoursWatched = payloadData.stats?.hours_watched || 0;
            emailData.data.membershipMonths = payloadData.stats?.membership_months || 1;
            emailData.data.monthlyUpdates = payloadData.benefits?.monthly_updates || [];
            emailData.data.loyaltyDiscount = payloadData.benefits?.loyalty_discount || false;
            emailData.data.loyaltyDiscountPercent = payloadData.benefits?.loyalty_discount_percent || 0;
            emailData.data.hasExclusiveBonus = payloadData.benefits?.has_exclusive_bonus || false;
            emailData.data.exclusiveBonusName = payloadData.benefits?.exclusive_bonus_name || '';
            emailData.data.communityMembers = payloadData.community?.total_members || 5000;
            emailData.data.postsCreated = payloadData.community?.posts || 0;
            emailData.data.comments = payloadData.community?.comments || 0;
            emailData.data.connectionsMade = payloadData.community?.connections || 0;
            emailData.data.subscriptionManagementUrl = `https://${event.organization.domain}/assinatura`;
            emailData.data.organizationCNPJ = (event.organization.emailSettings as any)?.cnpj || '00.000.000/0001-00';
            break;

          case 'ABANDONED_CART':
            emailData.data.checkoutUrl = payloadData.checkout_url || '#';
            emailData.data.totalPrice = payloadData.total_price || payloadData.amount || 'R$ 0,00';
            emailData.data.products = payloadData.products || [];
            emailData.data.productName = payloadData.product?.name || payloadData.products?.[0]?.name || 'Produto';
            if (payloadData.products && payloadData.products[0]) {
              emailData.data.productPrice = payloadData.products[0].price || 'R$ 0,00';
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

        // Registrar falha no banco apenas se tivermos informações suficientes
        if (template && customerEmail && customerEmail !== 'unknown') {
          await prisma.emailLog.create({
            data: {
              organizationId,
              eventId,
              to: customerEmail,
              subject: template.subject || 'Failed to send',
              template: template.templateName || 'unknown',
              status: 'FAILED',
              attemptNumber,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          }).catch((err) => {
            logger.error('Failed to log email failure', err);
          });
        }

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

  logger.info('📧 Email worker created and running');
  
  // Export do worker (compatibilidade com CommonJS e ES6)
  module.exports = { emailWorker };
  exports.emailWorker = emailWorker;
  
} catch (error) {
  logger.error('Failed to create email worker', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
  });
  throw error;
} 