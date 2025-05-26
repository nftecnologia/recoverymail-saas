import { Router } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { env } from '../config/env';
import crypto from 'crypto';

const router = Router();

// Schema para eventos do Resend
const resendWebhookSchema = z.object({
  type: z.enum([
    'email.sent',
    'email.delivered',
    'email.delivery_delayed',
    'email.opened',
    'email.clicked',
    'email.bounced',
    'email.complained',
    'domain.created',
    'domain.updated',
    'domain.deleted',
    'contact.created',
    'contact.updated',
    'contact.deleted',
  ]),
  created_at: z.string(),
  data: z.object({
    email_id: z.string().optional(),
    from: z.string().optional(),
    to: z.array(z.string()).optional(),
    subject: z.string().optional(),
    click: z.object({
      link: z.string(),
      timestamp: z.string(),
      user_agent: z.string().optional(),
      ip_address: z.string().optional(),
    }).optional(),
  }).passthrough(),
});

/**
 * Verificar assinatura do webhook do Resend
 */
function verifyResendSignature(
  rawBody: string,
  signature: string | undefined
): boolean {
  if (!signature || !env.RESEND_WEBHOOK_SECRET) {
    logger.warn('Missing Resend webhook signature or secret');
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', env.RESEND_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    logger.error('Error verifying Resend signature', { error });
    return false;
  }
}

/**
 * POST /resend-webhook
 * Recebe eventos de tracking do Resend
 */
router.post('/resend-webhook', async (req, res): Promise<void> => {
  try {
    // Verificar assinatura (em produção)
    if (env.NODE_ENV === 'production') {
      const signature = req.headers['resend-signature'] as string;
      const rawBody = JSON.stringify(req.body);
      
      if (!verifyResendSignature(rawBody, signature)) {
        logger.warn('Invalid Resend webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    // Validar payload
    const validatedData = resendWebhookSchema.parse(req.body);
    const { type, data } = validatedData;

    logger.info('Resend webhook received', {
      type,
      emailId: data.email_id,
      to: data.to,
    });

    // Ignorar eventos que não são de email
    if (!type.startsWith('email.')) {
      logger.info('Non-email event received, ignoring', { type });
      return res.status(200).json({ received: true });
    }

    // Verificar se temos email_id
    if (!data.email_id) {
      logger.warn('Email event without email_id', { type });
      return res.status(200).json({ received: true });
    }

    // Buscar log de email pelo ID do Resend
    const emailLog = await prisma.emailLog.findFirst({
      where: { emailId: data.email_id },
    });

    if (!emailLog) {
      logger.warn('Email log not found for Resend event', {
        emailId: data.email_id,
        type,
      });
      return res.status(200).json({ received: true });
    }

    // Atualizar status baseado no tipo de evento
    switch (type) {
      case 'email.delivered':
        await prisma.emailLog.update({
          where: { id: emailLog.id },
          data: { status: 'DELIVERED' },
        });
        break;

      case 'email.opened':
        await prisma.emailLog.update({
          where: { id: emailLog.id },
          data: {
            status: 'OPENED',
            openedAt: new Date(validatedData.created_at),
          },
        });
        logger.info('Email opened', {
          emailId: data.email_id,
          to: data.to?.[0] || 'unknown',
          organizationId: emailLog.organizationId,
        });
        break;

      case 'email.clicked':
        await prisma.emailLog.update({
          where: { id: emailLog.id },
          data: {
            status: 'CLICKED',
            clickedAt: new Date(validatedData.created_at),
          },
        });
        
        // Log detalhado do clique
        logger.info('Email link clicked', {
          emailId: data.email_id,
          to: data.to?.[0] || 'unknown',
          link: data.click?.link,
          userAgent: data.click?.user_agent,
          ipAddress: data.click?.ip_address,
          organizationId: emailLog.organizationId,
        });
        break;

      case 'email.bounced':
        await prisma.emailLog.update({
          where: { id: emailLog.id },
          data: {
            status: 'BOUNCED',
            error: 'Email bounced',
          },
        });
        break;

      case 'email.complained':
        await prisma.emailLog.update({
          where: { id: emailLog.id },
          data: {
            status: 'FAILED',
            error: 'Spam complaint received',
          },
        });
        break;
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Error processing Resend webhook', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body,
    });

    // Retornar 200 mesmo em erro para evitar retry do Resend
    res.status(200).json({ received: true, error: true });
  }
});

export default router; 