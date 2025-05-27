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

export default router; 