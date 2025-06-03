import { Router } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';
import { logger } from '../utils/logger';
import domainRoutes from './domain.routes';
import { authenticateToken, authenticateOrganization } from '../middleware/auth.middleware';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

// Aplicar autenticação a todas as rotas da API
router.use(authenticateToken);
router.use(authenticateOrganization);

// GET /api/dashboard/metrics
router.get('/dashboard/metrics', async (req, res) => {
  try {
    const organizationId = req.organization!.id;
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
router.get('/events', async (req, res) => {
  try {
    const organizationId = req.organization!.id;
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
router.get('/emails', async (req, res) => {
  try {
    const organizationId = req.organization!.id;
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
router.get('/metrics/charts', async (req, res) => {
  try {
    const organizationId = req.organization!.id;
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
router.get('/settings', async (req, res) => {
  try {
    const organizationId = req.organization!.id;

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
        webhookUrl: `${process.env['API_URL'] || 'https://api.inboxrecovery.com'}/webhook/${organization.id}`
      },
      emailsToday
    });
  } catch (error) {
    logger.error('Error fetching settings', { error });
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings/email
router.put('/settings/email', async (req, res) => {
  try {
    const organizationId = req.organization!.id;
    
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
router.use('/domain', domainRoutes);

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
          id: (w as any)['id'],
          name: (w as any)['name']
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
    await queue.clean(0, 0, 'failed');
    
    // Limpar delayed jobs
    await queue.clean(0, 0, 'delayed');
    
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

// TESTE IMEDIATO: Enviar email de carrinho abandonado sem delay
router.post('/test-immediate-email', async (_req, res) => {
  try {
    const { sendEmail } = await import('../services/email.service');
    const { prisma } = await import('../config/database');
    
    // Criar evento de teste
    const testEvent = await prisma.webhookEvent.create({
      data: {
        organizationId: 'test-org-123',
        eventType: 'ABANDONED_CART',
        payload: {
          event: 'ABANDONED_CART',
          checkout_id: `IMMEDIATE-TEST-${Date.now()}`,
          checkout_url: 'https://example.com/checkout/test-immediate',
          total_price: 'R$ 299,90',
          customer: {
            name: 'Teste Imediato',
            email: 'nicolas.fer.oli@gmail.com',
            phone_number: '5511999999999'
          },
          products: [
            {
              name: 'Produto Teste Imediato',
              price: 'R$ 299,90',
              quantity: 1,
              image_url: 'https://via.placeholder.com/200'
            }
          ]
        },
        externalId: `IMMEDIATE-TEST-${Date.now()}`,
        status: 'PENDING'
      }
    });
    
    // Preparar dados do email (primeiro email de carrinho abandonado)
    const payload = testEvent.payload as any;
    const emailData = {
      to: payload.customer.email,
      subject: '🛒 Você esqueceu alguns itens no seu carrinho',
      template: 'abandoned-cart-reminder',
      data: {
        customerName: payload.customer.name,
        checkoutUrl: payload.checkout_url,
        totalPrice: payload.total_price,
        products: payload.products
      },
      organizationId: testEvent.organizationId,
      eventId: testEvent.id,
      attemptNumber: 1
    };
    
    // Enviar email imediatamente
    const emailId = await sendEmail(emailData);
    
    // Atualizar status do evento
    await prisma.webhookEvent.update({
      where: { id: testEvent.id },
      data: {
        status: 'PROCESSED',
        processedAt: new Date()
      }
    });
    
    res.json({
      success: true,
      message: 'Email enviado imediatamente!',
      eventId: testEvent.id,
      emailId: emailId,
      to: emailData.to,
      subject: emailData.subject,
      checkEmail: 'Verifique seu email nicolas.fer.oli@gmail.com'
    });
    
  } catch (error: any) {
    logger.error('Error sending immediate email', { error });
    res.status(500).json({
      success: false,
      error: error.message,
      details: process.env['NODE_ENV'] === 'development' ? error.stack : undefined
    });
  }
});

// Worker status endpoint
router.get('/worker-status', async (_req, res) => {
  try {
    const { getQueue } = await import('../services/queue.service');
    const queue = getQueue();
    const workers = await queue.getWorkers();
    const workerCount = await queue.getWorkersCount();
    const activeCount = await queue.getActiveCount();
    const waitingCount = await queue.getWaitingCount();
    
    res.json({
      status: 'ok',
      workers: {
        count: workerCount,
        active: activeCount,
        waiting: waitingCount,
        details: workers.map(w => ({
          id: (w as any)['id'],
          state: (w as any)['state']
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

// ===== ROTAS DE TEMPLATES =====

// GET /api/templates - Listar todos os templates
router.get('/templates', async (_req, res) => {
  try {
    const templatesDir = path.join(__dirname, '../templates/emails');
    const files = await fs.readdir(templatesDir);
    const hbsFiles = files.filter(file => file.endsWith('.hbs'));
    
    const templates = await Promise.all(
      hbsFiles.map(async (file) => {
        const filePath = path.join(templatesDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const stats = await fs.stat(filePath);
        
        // Extrair informações do nome do arquivo
        const name = file.replace('.hbs', '');
        const parts = name.split('-');
        const eventType = parts.slice(0, -1).join('_').toUpperCase();
        const templateType = parts[parts.length - 1];
        
        return {
          id: name,
          name: name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          filename: file,
          eventType,
          templateType,
          content,
          size: stats.size,
          lastModified: stats.mtime,
          path: filePath
        };
      })
    );
    
    // Agrupar por evento
    const groupedTemplates = templates.reduce((acc, template) => {
      if (!acc[template.eventType]) {
        acc[template.eventType] = [];
      }
      acc[template.eventType]!.push(template);
      return acc;
    }, {} as Record<string, typeof templates>);
    
    res.json({
      templates,
      groupedTemplates,
      totalTemplates: templates.length,
      eventTypes: Object.keys(groupedTemplates)
    });
  } catch (error: any) {
    logger.error('Error listing templates:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// GET /api/templates/:templateId - Obter template específico
router.get('/templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const templatesDir = path.join(__dirname, '../templates/emails');
    const filePath = path.join(templatesDir, `${templateId}.hbs`);
    
    const content = await fs.readFile(filePath, 'utf-8');
    const stats = await fs.stat(filePath);
    
    const parts = templateId.split('-');
    const eventType = parts.slice(0, -1).join('_').toUpperCase();
    const templateType = parts[parts.length - 1] || 'default';
    
    res.json({
      id: templateId,
      name: templateId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      filename: `${templateId}.hbs`,
      eventType,
      templateType,
      content,
      size: stats.size,
      lastModified: stats.mtime
    });
  } catch (error: any) {
    logger.error('Error getting template:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// PUT /api/templates/:templateId - Atualizar template
router.put('/templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { content } = req.body;
    
    if (!content || typeof content !== 'string') {
      res.status(400).json({
        error: 'Content is required and must be a string'
      });
      return;
    }
    
    const templatesDir = path.join(__dirname, '../templates/emails');
    const filePath = path.join(templatesDir, `${templateId}.hbs`);
    
    // Verificar se o arquivo existe
    try {
      await fs.access(filePath);
    } catch {
      res.status(404).json({
        error: 'Template not found'
      });
      return;
    }
    
    // Fazer backup do arquivo original
    const backupPath = path.join(templatesDir, `${templateId}.hbs.backup.${Date.now()}`);
    const originalContent = await fs.readFile(filePath, 'utf-8');
    await fs.writeFile(backupPath, originalContent, 'utf-8');
    
    // Salvar novo conteúdo
    await fs.writeFile(filePath, content, 'utf-8');
    
    const stats = await fs.stat(filePath);
    
    logger.info(`Template ${templateId} updated successfully`, {
      organizationId: req.organization!.id,
      userId: req.user!.id,
      templateId,
      backupPath
    });
    
    res.json({
      success: true,
      message: 'Template updated successfully',
      template: {
        id: templateId,
        size: stats.size,
        lastModified: stats.mtime,
        backupPath
      }
    });
  } catch (error: any) {
    logger.error('Error updating template:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// POST /api/templates/:templateId/preview - Preview template com dados de teste
router.post('/templates/:templateId/preview', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { testData } = req.body;
    
    const templatesDir = path.join(__dirname, '../templates/emails');
    const filePath = path.join(templatesDir, `${templateId}.hbs`);
    
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Usar dados de teste padrão se não fornecidos
    const defaultTestData = {
      customerName: 'João Silva',
      customerEmail: 'joao@exemplo.com',
      productName: 'Curso de Marketing Digital',
      productPrice: 'R$ 297,00',
      discountPercent: '50',
      discountAmount: 'R$ 148,50',
      expiryDate: '15/01/2025',
      supportEmail: 'suporte@empresa.com',
      companyName: 'Sua Empresa',
      purchaseDate: '10/01/2025',
      orderNumber: '#12345',
      ...testData
    };
    
    // Simular compilação do Handlebars (básico)
    let previewContent = content;
    Object.entries(defaultTestData).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      previewContent = previewContent.replace(regex, String(value));
    });
    
    res.json({
      success: true,
      preview: previewContent,
      testData: defaultTestData,
      originalContent: content
    });
  } catch (error: any) {
    logger.error('Error previewing template:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// ===== ROTAS DE ORGANIZAÇÕES =====

// GET /api/organizations - Listar organizações do usuário
router.get('/organizations', async (req, res) => {
  try {
    const userId = req.user!.id;
    
    const userOrganizations = await prisma.userOrganization.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            _count: {
              select: {
                webhookEvents: true,
                emailLogs: true
              }
            }
          }
        }
      },
      orderBy: {
        joinedAt: 'desc'
      }
    });
    
    res.json({
      organizations: userOrganizations.map(uo => ({
        ...uo.organization,
        role: uo.role,
        permissions: uo.permissions,
        joinedAt: uo.joinedAt,
        stats: {
          totalEvents: uo.organization._count.webhookEvents,
          totalEmails: uo.organization._count.emailLogs
        }
      }))
    });
  } catch (error: any) {
    logger.error('Error listing organizations:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// GET /api/organizations/:orgId - Obter detalhes da organização
router.get('/organizations/:orgId', async (req, res) => {
  try {
    const { orgId } = req.params;
    const userId = req.user!.id;
    
    // Verificar se usuário tem acesso à organização
    const userOrg = await prisma.userOrganization.findFirst({
      where: {
        userId,
        organizationId: orgId
      }
    });
    
    if (!userOrg) {
      res.status(403).json({
        error: 'Access denied to this organization'
      });
      return;
    }
    
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                isActive: true
              }
            }
          }
        },
        _count: {
          select: {
            webhookEvents: true,
            emailLogs: true
          }
        }
      }
    });
    
    if (!organization) {
      res.status(404).json({
        error: 'Organization not found'
      });
      return;
    }
    
    res.json({
      organization: {
        ...organization,
        stats: {
          totalEvents: organization._count.webhookEvents,
          totalEmails: organization._count.emailLogs,
          totalUsers: organization.users.length
        }
      },
      userRole: userOrg.role,
      userPermissions: userOrg.permissions
    });
  } catch (error: any) {
    logger.error('Error getting organization:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// PUT /api/organizations/:orgId - Atualizar organização
router.put('/organizations/:orgId', async (req, res) => {
  try {
    const { orgId } = req.params;
    const userId = req.user!.id;
    const { name, webhookUrl, emailSettings } = req.body;
    
    // Verificar se usuário tem permissão para editar
    const userOrg = await prisma.userOrganization.findFirst({
      where: {
        userId,
        organizationId: orgId,
        role: { in: ['OWNER', 'ADMIN'] }
      }
    });
    
    if (!userOrg) {
      res.status(403).json({
        error: 'Insufficient permissions to update organization'
      });
      return;
    }
    
    const updatedOrganization = await prisma.organization.update({
      where: { id: orgId },
      data: {
        ...(name && { name }),
        ...(webhookUrl && { webhookUrl }),
        ...(emailSettings && { emailSettings })
      }
    });
    
    logger.info(`Organization ${orgId} updated by user ${userId}`, {
      organizationId: orgId,
      userId,
      changes: { name, webhookUrl, emailSettings }
    });
    
    res.json({
      success: true,
      organization: updatedOrganization
    });
  } catch (error: any) {
    logger.error('Error updating organization:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// POST /api/organizations/:orgId/regenerate-keys - Regenerar chaves da organização
router.post('/organizations/:orgId/regenerate-keys', async (req, res) => {
  try {
    const { orgId } = req.params;
    const userId = req.user!.id;
    const { keyType } = req.body; // 'apiKey' ou 'webhookSecret'
    
    // Verificar se usuário tem permissão
    const userOrg = await prisma.userOrganization.findFirst({
      where: {
        userId,
        organizationId: orgId,
        role: { in: ['OWNER', 'ADMIN'] }
      }
    });
    
    if (!userOrg) {
      res.status(403).json({
        error: 'Insufficient permissions'
      });
      return;
    }
    
    const updateData: any = {};
    
    if (keyType === 'apiKey') {
      updateData.apiKey = `sk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } else if (keyType === 'webhookSecret') {
      updateData.webhookSecret = `whsec_${Math.random().toString(36).substr(2, 32)}`;
    } else {
      res.status(400).json({
        error: 'Invalid key type. Must be "apiKey" or "webhookSecret"'
      });
      return;
    }
    
    await prisma.organization.update({
      where: { id: orgId },
      data: updateData
    });
    
    logger.warn(`${keyType} regenerated for organization ${orgId} by user ${userId}`, {
      organizationId: orgId,
      userId,
      keyType
    });
    
    res.json({
      success: true,
      message: `${keyType} regenerated successfully`,
      [keyType]: updateData[keyType]
    });
  } catch (error: any) {
    logger.error('Error regenerating keys:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// POST /api/organizations/:orgId/invite - Convidar usuário para organização
router.post('/organizations/:orgId/invite', async (req, res) => {
  try {
    const { orgId } = req.params;
    const userId = req.user!.id;
    const { email, role = 'MEMBER', permissions = [] } = req.body;
    
    // Verificar se usuário pode convidar
    const userOrg = await prisma.userOrganization.findFirst({
      where: {
        userId,
        organizationId: orgId,
        role: { in: ['OWNER', 'ADMIN'] }
      }
    });
    
    if (!userOrg) {
      res.status(403).json({
        error: 'Insufficient permissions to invite users'
      });
      return;
    }
    
    // Verificar se usuário existe
    const targetUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!targetUser) {
      res.status(404).json({
        error: 'User not found'
      });
      return;
    }
    
    // Verificar se já é membro
    const existingMembership = await prisma.userOrganization.findFirst({
      where: {
        userId: targetUser.id,
        organizationId: orgId
      }
    });
    
    if (existingMembership) {
      res.status(400).json({
        error: 'User is already a member of this organization'
      });
      return;
    }
    
    // Criar convite/adicionar usuário
    const newMembership = await prisma.userOrganization.create({
      data: {
        userId: targetUser.id,
        organizationId: orgId,
        role,
        permissions
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    logger.info(`User ${targetUser.email} invited to organization ${orgId} by ${userId}`, {
      organizationId: orgId,
      invitedUserId: targetUser.id,
      invitedByUserId: userId,
      role
    });
    
    res.json({
      success: true,
      message: 'User invited successfully',
      membership: newMembership
    });
  } catch (error: any) {
    logger.error('Error inviting user:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

export default router; 