import { Router } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { prisma } from '../config/database';
import { validateWebhookPayload } from '../utils/webhook.validator';
import { enqueueEmailJob } from '../services/trigger.service';

const router = Router();

// Schema básico para validação inicial
const webhookSchema = z.object({
  event: z.string(),
  timestamp: z.string().optional(),
});

// POST /webhook/:orgId
// Descomente a linha abaixo para ativar validação HMAC em produção
// router.post('/:orgId', validateHMAC, async (req, res, next) => {
router.post('/:orgId', async (req, res, next): Promise<void> => {
  try {
    const { orgId } = req.params;
    const payload = req.body;

    logger.info('Webhook received', { 
      orgId, 
      event: payload.event,
      headers: req.headers 
    });

    // Validação básica
    const basicValidation = webhookSchema.safeParse(payload);
    if (!basicValidation.success) {
      throw new AppError('Invalid webhook payload', 400);
    }

    // Verificar se a organização existe
    const organization = await prisma.organization.findUnique({
      where: { id: orgId }
    });

    if (!organization) {
      throw new AppError('Organization not found', 404);
    }

    // TODO: Implementar validação HMAC
    // const signature = req.headers['x-webhook-signature'] as string;
    // if (!validateHMAC(payload, signature, organization.webhookSecret)) {
    //   throw new AppError('Invalid webhook signature', 401);
    // }

    // Validar payload específico do evento
    const validatedPayload = validateWebhookPayload(payload);

    // Verificar idempotência
    const externalId = (validatedPayload as any).checkout_id || 
                      (validatedPayload as any).transaction_id || 
                      (validatedPayload as any).order_number || 
                      '';
    
    const existingEvent = await prisma.webhookEvent.findFirst({
      where: {
        organizationId: orgId,
        eventType: validatedPayload.event,
        externalId: externalId,
      }
    });

    if (existingEvent) {
      logger.warn('Duplicate webhook event', { 
        eventId: existingEvent.id,
        orgId 
      });
      res.status(200).json({ 
        message: 'Event already processed',
        eventId: existingEvent.id 
      });
      return;
    }

    // Salvar evento no banco
    const event = await prisma.webhookEvent.create({
      data: {
        organizationId: orgId,
        eventType: validatedPayload.event,
        payload: payload,
        externalId: externalId,
        status: 'PENDING',
      }
    });

    logger.info('Webhook event saved', { 
      eventId: event.id,
      eventType: event.eventType 
    });

    // Adicionar à fila de processamento
    const forceImmediate = req.headers['x-force-immediate'] === 'true';
    await enqueueEmailJob(event, forceImmediate);

    res.status(200).json({ 
      message: 'Webhook received successfully',
      eventId: event.id 
    });

  } catch (error) {
    next(error);
  }
});

// GET /webhook/health
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router; 