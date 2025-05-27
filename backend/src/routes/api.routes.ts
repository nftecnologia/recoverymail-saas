import { Router } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';
import { logger } from '../utils/logger';
import domainRoutes from './domain.routes';

const router = Router();

// Middleware para validar organizationId
const validateOrgId = async (req: any, res: any, next: any): Promise<void> => {
  const orgId = req.headers['x-organization-id'] as string;
  
  if (!orgId) {
    res.status(401).json({ error: 'Organization ID required' });
    return;
  }

  try {
    const org = await prisma.organization.findUnique({
      where: { id: orgId }
    });

    if (!org) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    req.organizationId = orgId;
    next();
  } catch (error) {
    logger.error('Error validating organization', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/dashboard/metrics
router.get('/dashboard/metrics', validateOrgId, async (req, res) => {
  try {
    const { organizationId } = req as any;
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total de eventos
    const totalEvents = await prisma.webhookEvent.count({
      where: { organizationId }
    });

    // Eventos processados
    const processedEvents = await prisma.webhookEvent.count({
      where: { 
        organizationId,
        status: 'PROCESSED'
      }
    });

    // Total de emails
    const totalEmails = await prisma.emailLog.count({
      where: { organizationId }
    });

    // Emails por status
    const emailsByStatus = await prisma.emailLog.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: true
    });

    // Taxa de abertura e cliques
    const openedEmails = await prisma.emailLog.count({
      where: { 
        organizationId,
        openedAt: { not: null }
      }
    });

    const clickedEmails = await prisma.emailLog.count({
      where: { 
        organizationId,
        clickedAt: { not: null }
      }
    });

    // Eventos dos últimos 7 dias
    const recentEvents = await prisma.webhookEvent.count({
      where: {
        organizationId,
        createdAt: { gte: last7Days }
      }
    });

    const metrics = {
      totalEvents,
      processedEvents,
      failedEvents: totalEvents - processedEvents,
      totalEmails,
      sentEmails: emailsByStatus.find(e => e.status === 'SENT')?._count || 0,
      deliveredEmails: emailsByStatus.find(e => e.status === 'DELIVERED')?._count || 0,
      openedEmails,
      clickedEmails,
      bouncedEmails: emailsByStatus.find(e => e.status === 'BOUNCED')?._count || 0,
      openRate: totalEmails > 0 ? (openedEmails / totalEmails * 100).toFixed(1) : '0',
      clickRate: totalEmails > 0 ? (clickedEmails / totalEmails * 100).toFixed(1) : '0',
      recentEvents,
      processingRate: totalEvents > 0 ? (processedEvents / totalEvents * 100).toFixed(1) : '0'
    };

    res.json(metrics);
  } catch (error) {
    logger.error('Error fetching metrics', { error });
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// GET /api/events
router.get('/events', validateOrgId, async (req, res) => {
  try {
    const { organizationId } = req as any;
    const { page = '1', limit = '20', type, status } = req.query;

    const where: any = { organizationId };
    
    if (type) {
      where.eventType = type as string;
    }
    
    if (status) {
      where.status = status as string;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [events, total] = await Promise.all([
      prisma.webhookEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.webhookEvent.count({ where })
    ]);

    res.json({
      events,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Error fetching events', { error });
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/emails
router.get('/emails', validateOrgId, async (req, res) => {
  try {
    const { organizationId } = req as any;
    const { page = '1', limit = '20', status, template } = req.query;

    const where: any = { organizationId };
    
    if (status) {
      where.status = status as string;
    }
    
    if (template) {
      where.template = template as string;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [emails, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.emailLog.count({ where })
    ]);

    res.json({
      emails,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Error fetching emails', { error });
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

// GET /api/metrics/charts
router.get('/metrics/charts', validateOrgId, async (req, res) => {
  try {
    const { organizationId } = req as any;
    const { period = '7d' } = req.query;

    const days = period === '30d' ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Emails ao longo do tempo
    const emailsOverTime = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) FILTER (WHERE status IN ('SENT', 'DELIVERED', 'OPENED', 'CLICKED')) as sent,
        COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened,
        COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) as clicked
      FROM "EmailLog"
      WHERE organization_id = ${organizationId}
        AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    // Eventos por tipo
    const eventsByType = await prisma.webhookEvent.groupBy({
      by: ['eventType'],
      where: {
        organizationId,
        createdAt: { gte: startDate }
      },
      _count: true
    });

    // Taxa de conversão por template
    const conversionByTemplate = await prisma.$queryRaw`
      SELECT 
        template,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) as clicked,
        CASE 
          WHEN COUNT(*) > 0 
          THEN ROUND(COUNT(*) FILTER (WHERE clicked_at IS NOT NULL)::numeric / COUNT(*)::numeric * 100, 1)
          ELSE 0 
        END as conversion_rate
      FROM "EmailLog"
      WHERE organization_id = ${organizationId}
        AND created_at >= ${startDate}
      GROUP BY template
      ORDER BY conversion_rate DESC
    `;

    res.json({
      emailsOverTime,
      eventsByType: eventsByType.map(e => ({
        name: e.eventType,
        value: e._count
      })),
      conversionByTemplate
    });
  } catch (error) {
    logger.error('Error fetching chart data', { error });
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

// GET /api/settings
router.get('/settings', validateOrgId, async (req, res) => {
  try {
    const { organizationId } = req as any;

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        domain: true,
        apiKey: true,
        webhookSecret: true,
        emailSettings: true,
        createdAt: true
      }
    });

    if (!organization) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    // Contar emails enviados hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const emailsToday = await prisma.emailLog.count({
      where: {
        organizationId,
        createdAt: { gte: today }
      }
    });

    res.json({
      organization: {
        ...organization,
        webhookUrl: `${process.env['API_URL'] || 'http://localhost:4000'}/webhook/${organization.id}`
      },
      emailsToday
    });
  } catch (error) {
    logger.error('Error fetching settings', { error });
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings/email
router.put('/settings/email', validateOrgId, async (req, res) => {
  try {
    const { organizationId } = req as any;
    
    const schema = z.object({
      fromName: z.string(),
      fromEmail: z.string().email(),
      replyTo: z.string().email(),
      dailyLimit: z.number().min(1)
    });

    const emailSettings = schema.parse(req.body);

    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: { emailSettings }
    });

    res.json({ success: true, emailSettings: updated.emailSettings });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid email settings', details: error.errors });
      return;
    }
    logger.error('Error updating email settings', { error });
    res.status(500).json({ error: 'Failed to update email settings' });
  }
});

// Rotas de domínio
router.use('/domain', validateOrgId, domainRoutes);

// TEMPORÁRIO: Teste simples
router.get('/test', (_req, res) => {
  res.json({
    message: 'API is working',
    timestamp: new Date().toISOString(),
    redisConfigured: !!process.env['REDIS_URL']
  });
});

// TEMPORÁRIO: Testar Redis
router.get('/test-redis', async (_req, res) => {
  try {
    // Verificar se REDIS_URL está configurado
    const redisUrl = process.env['REDIS_URL'];
    
    if (!redisUrl) {
      res.json({
        redis: 'not configured',
        error: 'REDIS_URL environment variable is not set',
        redisUrl: 'NOT CONFIGURED'
      });
      return;
    }
    
    // Tentar importar e conectar
    try {
      const { getQueue } = await import('../services/queue.service');
      const queue = getQueue();
      const jobCounts = await queue.getJobCounts();
      
      res.json({
        redis: 'connected',
        queue: queue.name,
        jobs: jobCounts,
        redisUrl: 'configured',
        redisHost: redisUrl.split('@')[1]?.split(':')[0] || 'unknown'
      });
    } catch (queueError: any) {
      res.json({
        redis: 'connection failed',
        error: queueError.message,
        redisUrl: 'configured',
        details: 'Failed to connect to Redis or get queue'
      });
    }
  } catch (error: any) {
    res.status(500).json({
      redis: 'error',
      error: error.message,
      stack: process.env['NODE_ENV'] === 'development' ? error.stack : undefined
    });
  }
});

// TEMPORÁRIO: Ver jobs failed
router.get('/test-failed-jobs', async (_req, res) => {
  try {
    const { getQueue } = await import('../services/queue.service');
    const queue = getQueue();
    
    // Pegar jobs failed
    const failedJobs = await queue.getFailed(0, 10);
    
    const failedDetails = failedJobs.map(job => ({
      id: job.id,
      name: job.name,
      data: job.data,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn
    }));
    
    res.json({
      totalFailed: failedJobs.length,
      failedJobs: failedDetails
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message
    });
  }
});

// TEMPORÁRIO: Processar job imediatamente
router.post('/test-process-now', async (_req, res) => {
  try {
    const { enqueueEmailJob } = await import('../services/queue.service');
    const { prisma } = await import('../config/database');
    
    // Pegar o último evento
    const lastEvent = await prisma.webhookEvent.findFirst({
      where: { 
        organizationId: 'test-org-123',
        status: 'PENDING'
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!lastEvent) {
      res.status(404).json({ error: 'No pending events found' });
      return;
    }
    
    // Enfileirar com forceImmediate = true
    await enqueueEmailJob(lastEvent, true);
    
    res.json({
      message: 'Job enqueued for immediate processing',
      eventId: lastEvent.id,
      eventType: lastEvent.eventType
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message
    });
  }
});

// TEMPORÁRIO: Verificar se worker está rodando
router.get('/test-worker-status', async (_req, res) => {
  try {
    const { getQueue } = await import('../services/queue.service');
    const queue = getQueue();
    
    // Verificar workers
    const workers = await queue.getWorkers();
    
    // Pegar informações da queue
    const jobCounts = await queue.getJobCounts();
    const isPaused = await queue.isPaused();
    
    res.json({
      queue: {
        name: queue.name,
        isPaused,
        jobCounts
      },
      workers: {
        count: workers.length,
        details: workers.map(w => ({
          id: w.id,
          name: w.name
        }))
      },
      workerStatus: workers.length > 0 ? 'running' : 'not running'
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
      workerStatus: 'error'
    });
  }
});

// TEMPORÁRIO: Limpar filas para teste
router.post('/test-clear-queues', async (_req, res) => {
  try {
    const { getQueue } = await import('../services/queue.service');
    const queue = getQueue();
    
    // Limpar failed jobs
    await queue.clean(0, 'failed');
    
    // Limpar delayed jobs
    await queue.clean(0, 'delayed');
    
    // Pegar novo status
    const jobCounts = await queue.getJobCounts();
    
    res.json({
      message: 'Queues cleared',
      jobCounts
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message
    });
  }
});

// TEMPORÁRIO: Testar Resend diretamente
router.post('/test-resend', async (_req, res) => {
  try {
    const { Resend } = await import('resend');
    const resendApiKey = process.env['RESEND_API_KEY'];
    
    if (!resendApiKey) {
      res.status(400).json({ error: 'RESEND_API_KEY not configured' });
      return;
    }
    
    const resend = new Resend(resendApiKey);
    
    // Tentar enviar email de teste
    const { data, error } = await resend.emails.send({
      from: `Recovery Mail <${process.env['RESEND_FROM_EMAIL'] || 'noreply@resend.dev'}>`,
      to: 'nicolas.fer.oli@gmail.com',
      subject: '🧪 Teste direto do Resend - Recovery Mail',
      html: `
        <h1>Teste do Resend</h1>
        <p>Este é um teste direto da API do Resend.</p>
        <p>Se você recebeu este email, o Resend está funcionando!</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
      text: 'Teste direto do Resend. Se você recebeu este email, está funcionando!'
    });
    
    if (error) {
      res.status(400).json({
        error: 'Resend error',
        details: error,
        apiKeyConfigured: true,
        fromEmail: process.env['RESEND_FROM_EMAIL'] || 'noreply@resend.dev'
      });
      return;
    }
    
    res.json({
      success: true,
      emailId: data?.id,
      message: 'Email de teste enviado',
      fromEmail: process.env['RESEND_FROM_EMAIL'] || 'noreply@resend.dev'
    });
    
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
      stack: process.env['NODE_ENV'] === 'development' ? error.stack : undefined
    });
  }
});

// TEMPORÁRIO: Verificar templates
router.get('/test-templates', async (_req, res) => {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Verificar onde estamos
    const cwd = process.cwd();
    const dirname = __dirname;
    
    // Tentar listar templates
    const possiblePaths = [
      path.join(cwd, 'dist', 'templates', 'emails'),
      path.join(cwd, 'templates', 'emails'),
      path.join(dirname, '..', 'templates', 'emails'),
      path.join(dirname, '..', '..', 'templates', 'emails'),
    ];
    
    const results: any = {
      cwd,
      dirname,
      paths: {}
    };
    
    for (const templatePath of possiblePaths) {
      try {
        const files = await fs.readdir(templatePath);
        results.paths[templatePath] = {
          exists: true,
          files: files.filter(f => f.endsWith('.hbs'))
        };
      } catch (err) {
        results.paths[templatePath] = {
          exists: false,
          error: 'Directory not found'
        };
      }
    }
    
    res.json(results);
  } catch (error: any) {
    res.status(500).json({
      error: error.message
    });
  }
});

// TEMPORÁRIO: Limpar TODOS os jobs
router.post('/test-clear-all-jobs', async (_req, res) => {
  try {
    const { getQueue } = await import('../services/queue.service');
    const queue = getQueue();
    
    // Limpar TODOS os jobs
    await queue.obliterate({ force: true });
    
    // Pegar novo status
    const jobCounts = await queue.getJobCounts();
    
    res.json({
      message: 'All jobs cleared',
      jobCounts
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Worker status endpoint
router.get('/worker-status', async (req, res) => {
  try {
    const { getQueue } = await import('../services/queue.service');
    const queue = getQueue();
    const workers = await queue.getWorkers();
    const workerCount = await queue.getWorkerCount();
    const activeCount = await queue.getActiveCount();
    const waitingCount = await queue.getWaitingCount();
    
    res.json({
      status: 'ok',
      workers: {
        count: workerCount,
        active: activeCount,
        waiting: waitingCount,
        details: workers.map(w => ({
          id: w.id,
          state: w.state
        }))
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 