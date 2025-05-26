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

      // Preparar dados do email baseado no tipo de evento
      const customerData = payload.data?.customer || payload.customer;
      let emailData: any = {
        to: customerData.email,
        subject: template.subject.replace('{customerName}', customerData.name),
        template: template.templateName,
        data: {
          customerName: customerData.name,
          customerEmail: customerData.email,
          organizationName: event.organization.name,
          domain: event.organization.domain || 'example.com',
          attemptNumber,
          whatsappNumber: event.organization.whatsappNumber || '5511999999999',
          supportEmail: event.organization.supportEmail || 'suporte@example.com',
          organizationOwner: event.organization.ownerName || 'Equipe de Suporte',
        },
        organizationId,
        eventId,
        attemptNumber,
      };

      // Adicionar dados específicos por tipo de evento
      switch (eventType) {
        case 'ABANDONED_CART':
          emailData.data = {
            ...emailData.data,
            checkoutUrl: payload.data?.checkout_url,
            totalPrice: payload.data?.total_price,
            products: payload.data?.items || [],
            productName: payload.data?.items?.[0]?.name || 'Produto',
            productPrice: payload.data?.items?.[0]?.price || 'R$ 0,00',
            discountPercent: attemptNumber === 3 ? 10 : 0,
          };
          break;

        case 'BANK_SLIP_EXPIRED':
        case 'PIX_EXPIRED':
          emailData.data = {
            ...emailData.data,
            checkoutUrl: payload.data?.checkout_url || '#',
            totalPrice: payload.data?.amount,
            productName: payload.data?.product?.name || 'Produto',
            expirationDate: payload.data?.expired_at || payload.data?.original_due_date,
            pixDiscount: 10,
          };
          break;

        case 'SALE_REFUSED':
          emailData.data = {
            ...emailData.data,
            checkoutUrl: payload.checkout_url,
            productName: payload.product?.name || 'Produto',
            refusalReason: payload.refusal_reason || 'Pagamento não autorizado',
            pixDiscount: 15,
            totalModules: 12,
            communityMembers: 5000,
            hoursAgo: 2,
            supportCode: `SUP${eventId.slice(-6).toUpperCase()}`,
            testimonial1: 'Maria Silva',
            testimonial2: 'João Santos',
            testimonial3: 'Ana Costa',
            totalStudents: 10000,
            phoneNumber: event.organization.phoneNumber || '0800-123-4567',
            chatUrl: event.organization.chatUrl || 'https://chat.example.com',
          };
          break;

        case 'SALE_APPROVED':
          emailData.data = {
            ...emailData.data,
            orderNumber: payload.order_number,
            totalAmount: payload.amount,
            paymentMethod: payload.payment_method,
            productName: payload.product?.name || 'Produto',
            platformUrl: payload.access?.platform_url || 'https://plataforma.example.com',
            temporaryPassword: payload.access?.password || 'senha123',
            bonuses: payload.bonuses || [],
            communityMembers: 5000,
            productBenefit: 'alcançar seus objetivos',
            totalModules: 12,
            communityUrl: payload.community?.discord_url || '#',
            telegramUrl: payload.community?.telegram_url || '#',
            facebookGroupUrl: payload.community?.facebook_group_url || '#',
            hasMobileApp: false,
            organizationCNPJ: event.organization.cnpj || '00.000.000/0001-00',
            termsUrl: `https://${event.organization.domain}/termos`,
            privacyUrl: `https://${event.organization.domain}/privacidade`,
          };
          break;

        case 'SALE_CHARGEBACK':
          emailData.data = {
            ...emailData.data,
            productName: payload.product?.name || 'Produto',
            purchaseDate: payload.purchase_date,
            purchaseAmount: payload.amount,
            chargebackId: payload.chargeback_id,
            daysRemaining: payload.days_to_resolve || 7,
            billingDescriptor: payload.payment_details?.billing_descriptor || event.organization.name,
            cardLastDigits: payload.payment_details?.card_last_digits || '****',
            transactionId: payload.transaction_id,
            cancelChargebackUrl: payload.resolution_url || `https://${event.organization.domain}/resolver-chargeback`,
            resolveChargebackUrl: payload.resolution_url || `https://${event.organization.domain}/resolver-chargeback`,
            phoneNumber: event.organization.phoneNumber || '0800-123-4567',
            financeEmail: event.organization.financeEmail || 'financeiro@example.com',
          };
          break;

        case 'SALE_REFUNDED':
          emailData.data = {
            ...emailData.data,
            productName: payload.product?.name || 'Produto',
            refundAmount: payload.refund_amount,
            paymentMethod: payload.refund_method,
            refundDate: payload.refund_date,
            refundProtocol: payload.refund_id,
            feedbackUrl: payload.feedback_url || `https://${event.organization.domain}/feedback`,
            specialCode: eventId.slice(-4).toUpperCase(),
            organizationCNPJ: event.organization.cnpj || '00.000.000/0001-00',
            financeEmail: event.organization.financeEmail || 'financeiro@example.com',
            refundReceiptUrl: `https://${event.organization.domain}/comprovante/${payload.refund_id}`,
          };
          break;

        case 'SUBSCRIPTION_RENEWED':
          emailData.data = {
            ...emailData.data,
            productName: payload.product?.name || 'Produto',
            planName: payload.plan?.name || 'Plano Mensal',
            billingPeriod: payload.plan?.billing_period === 'monthly' ? 'Mensal' : 
                           payload.plan?.billing_period === 'quarterly' ? 'Trimestral' : 'Anual',
            renewalAmount: payload.plan?.amount || 'R$ 97,00',
            nextRenewalDate: payload.next_renewal_date,
            renewalProtocol: payload.renewal_id,
            platformUrl: payload.product?.platform_url || 'https://plataforma.example.com',
            completedLessons: payload.stats?.completed_lessons || 0,
            certificatesEarned: payload.stats?.certificates_earned || 0,
            hoursWatched: payload.stats?.hours_watched || 0,
            membershipMonths: payload.stats?.membership_months || 1,
            monthlyUpdates: payload.benefits?.monthly_updates || [],
            loyaltyDiscount: payload.benefits?.loyalty_discount ? true : false,
            loyaltyDiscountPercent: payload.benefits?.loyalty_discount?.percent || 0,
            hasExclusiveBonus: payload.benefits?.exclusive_bonus ? true : false,
            exclusiveBonusName: payload.benefits?.exclusive_bonus?.name || '',
            communityMembers: payload.community?.members_count || 5000,
            communityUrl: payload.community?.discord_url || '#',
            telegramUrl: payload.community?.telegram_url || '#',
            facebookGroupUrl: payload.community?.facebook_group_url || '#',
            subscriptionManagementUrl: `https://${event.organization.domain}/assinatura`,
            organizationCNPJ: event.organization.cnpj || '00.000.000/0001-00',
            termsUrl: `https://${event.organization.domain}/termos`,
            privacyUrl: `https://${event.organization.domain}/privacidade`,
            unsubscribeUrl: `https://${event.organization.domain}/cancelar-assinatura`,
          };
          break;

        default:
          // Manter dados genéricos para outros eventos
          emailData.data = {
            ...emailData.data,
            checkoutUrl: payload.checkout_url,
            totalPrice: payload.total_price || payload.amount,
            products: payload.products || [],
            productName: payload.product?.name || payload.products?.[0]?.name || 'Produto',
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