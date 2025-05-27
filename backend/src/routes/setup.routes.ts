import { Router } from 'express';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

const router = Router();

// Rota temporária para criar organização de teste
router.post('/setup/create-test-org', async (_req, res) => {
  try {
    const org = await prisma.organization.create({
      data: {
        id: 'test-org',
        name: 'Organização de Teste',
        domain: 'teste.recoverymail.com',
        webhookSecret: 'test-webhook-secret-123',
        apiKey: 'test-api-key-123',
        emailSettings: {
          replyTo: 'suporte@teste.com',
          includeUnsubscribe: true,
        },
      },
    });

    logger.info('Test organization created', { orgId: org.id });
    
    res.json({
      success: true,
      message: 'Organização de teste criada com sucesso!',
      organization: {
        id: org.id,
        name: org.name,
        webhookUrl: `https://recoverymail.onrender.com/webhook/${org.id}`
      }
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.json({
        success: true,
        message: 'Organização já existe',
        organization: {
          id: 'test-org',
          name: 'Organização de Teste',
          webhookUrl: 'https://recoverymail.onrender.com/webhook/test-org'
        }
      });
    } else {
      logger.error('Failed to create test organization', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao criar organização'
      });
    }
  }
});

export default router; 