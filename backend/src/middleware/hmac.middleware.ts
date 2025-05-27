import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';

export interface WebhookRequest extends Request {
  organization?: {
    id: string;
    webhookSecret: string;
  };
}

/**
 * Valida a assinatura HMAC do webhook
 * Espera o header X-Webhook-Signature no formato: sha256=<hash>
 */
export async function validateHMAC(
  req: WebhookRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { orgId } = req.params;
    const signature = req.headers['x-webhook-signature'] as string;

    if (!signature) {
      throw new AppError('Missing webhook signature', 401);
    }

    // Buscar o secret da organização
    const organization = await prisma.organization.findUnique({
      where: { id: orgId || '' },
      select: { id: true, webhookSecret: true },
    });

    if (!organization) {
      throw new AppError('Organization not found', 404);
    }

    if (!organization.webhookSecret) {
      throw new AppError('Webhook secret not configured', 500);
    }

    // Extrair o algoritmo e hash do header
    const parts = signature.split('=');
    if (parts.length !== 2 || parts[0] !== 'sha256') {
      throw new AppError('Invalid signature algorithm', 401);
    }
    const receivedHash = parts[1];

    // Calcular o hash esperado
    const payload = JSON.stringify(req.body);
    const expectedHash = crypto
      .createHmac('sha256', organization.webhookSecret)
      .update(payload, 'utf8')
      .digest('hex');

    // Comparar de forma segura (timing-safe)
    let isValid = false;
    try {
      const receivedBuffer = Buffer.from(receivedHash || '', 'hex');
      const expectedBuffer = Buffer.from(expectedHash, 'hex');
      
      if (receivedBuffer.length === expectedBuffer.length) {
        isValid = crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
      }
    } catch (err) {
      // Buffers de tamanhos diferentes ou erro de parsing
      isValid = false;
    }

    if (!isValid) {
      logger.warn('Invalid webhook signature', {
        orgId,
        receivedSignature: signature,
        expectedHash: `sha256=${expectedHash}`,
      });
      throw new AppError('Invalid webhook signature', 401);
    }

    // Adicionar organização ao request para uso posterior
    req.organization = {
      id: organization.id,
      webhookSecret: organization.webhookSecret || ''
    };
    
    logger.debug('Webhook signature validated', { orgId });
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Gera uma assinatura HMAC para testes
 */
export function generateSignature(payload: any, secret: string): string {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload), 'utf8')
    .digest('hex');
  
  return `sha256=${hash}`;
} 