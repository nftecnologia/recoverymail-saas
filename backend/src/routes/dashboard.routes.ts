import { Router } from 'express';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

const router = Router();

// GET /api/dashboard/metrics - Métricas gerais do dashboard
router.get('/metrics', async (req, res) => {
  try {
    const { organizationId } = req.query;
    
    if (!organizationId || typeof organizationId !== 'string') {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    // Métricas dos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Total de eventos
    const totalEvents = await prisma.webhookEvent.count({
      where: {
        organizationId,
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    // Total de emails enviados
    const totalEmails = await prisma.emailLog.count({
      where: {
        organizationId,
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    // Emails abertos
    const openedEmails = await prisma.emailLog.count({
      where: {
        organizationId,
        createdAt: { gte: thirtyDaysAgo },
        openedAt: { not: null }
      }
    });

    // Emails clicados
    const clickedEmails = await prisma.emailLog.count({
      where: {
        organizationId,
        createdAt: { gte: thirtyDaysAgo },
        clickedAt: { not: null }
      }
    });

    // Eventos por tipo
    const eventsByType = await prisma.webhookEvent.groupBy({
      by: ['eventType'],
      where: {
        organizationId,
        createdAt: { gte: thirtyDaysAgo }
      },
      _count: true
    });

    // Taxa de abertura e clique
    const openRate = totalEmails > 0 ? (openedEmails / totalEmails) * 100 : 0;
    const clickRate = totalEmails > 0 ? (clickedEmails / totalEmails) * 100 : 0;

    // Emails por dia (últimos 7 dias)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const emailsByDay = await prisma.emailLog.findMany({
      where: {
        organizationId,
        createdAt: { gte: sevenDaysAgo }
      },
      select: {
        createdAt: true,
        status: true
      }
    });

    // Agrupar emails por dia
    const emailsGroupedByDay = emailsByDay.reduce((acc: any, email) => {
      const day = email.createdAt.toISOString().split('T')[0];
      if (!acc[day]) {
        acc[day] = { date: day, sent: 0, opened: 0, clicked: 0 };
      }
      acc[day].sent++;
      return acc;
    }, {});

    const chartData = Object.values(emailsGroupedByDay);

    res.json({
      success: true,
      data: {
        overview: {
          totalEvents,
          totalEmails,
          openedEmails,
          clickedEmails,
          openRate: Number(openRate.toFixed(1)),
          clickRate: Number(clickRate.toFixed(1))
        },
        eventsByType: eventsByType.map(item => ({
          type: item.eventType,
          count: item._count
        })),
        chartData
      }
    });

  } catch (error) {
    logger.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch dashboard metrics' 
    });
  }
});

// GET /api/dashboard/events - Lista de eventos recentes
router.get('/events', async (req, res) => {
  try {
    const { organizationId, page = '1', limit = '20' } = req.query;
    
    if (!organizationId || typeof organizationId !== 'string') {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const events = await prisma.webhookEvent.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
      select: {
        id: true,
        eventType: true,
        status: true,
        createdAt: true,
        processedAt: true,
        payload: true
      }
    });

    const totalEvents = await prisma.webhookEvent.count({
      where: { organizationId }
    });

    // Extrair informações relevantes do payload para exibição
    const eventsWithDetails = events.map(event => {
      const payload = event.payload as any;
      let customerEmail = 'N/A';
      let customerName = 'N/A';
      let amount = 'N/A';

      if (payload?.customer?.email) customerEmail = payload.customer.email;
      if (payload?.customer?.name) customerName = payload.customer.name;
      if (payload?.total_price) amount = payload.total_price;
      if (payload?.amount) amount = payload.amount;

      return {
        id: event.id,
        eventType: event.eventType,
        status: event.status,
        createdAt: event.createdAt,
        processedAt: event.processedAt,
        customer: {
          email: customerEmail,
          name: customerName
        },
        amount
      };
    });

    res.json({
      success: true,
      data: {
        events: eventsWithDetails,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalEvents,
          pages: Math.ceil(totalEvents / limitNum)
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching events:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch events' 
    });
  }
});

// GET /api/dashboard/emails - Lista de emails enviados
router.get('/emails', async (req, res) => {
  try {
    const { organizationId, page = '1', limit = '20' } = req.query;
    
    if (!organizationId || typeof organizationId !== 'string') {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Buscar emails
    const emails = await prisma.emailLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum
    });

    // Buscar eventos relacionados separadamente
    const eventIds = emails.map(email => email.eventId);
    const events = await prisma.webhookEvent.findMany({
      where: { id: { in: eventIds } },
      select: { id: true, eventType: true }
    });

    const eventMap = events.reduce((acc, event) => {
      acc[event.id] = event.eventType;
      return acc;
    }, {} as Record<string, string>);

    const totalEmails = await prisma.emailLog.count({
      where: { organizationId }
    });

    res.json({
      success: true,
      data: {
        emails: emails.map(email => ({
          id: email.id,
          to: email.to,
          subject: email.subject,
          template: email.template,
          status: email.status,
          attemptNumber: email.attemptNumber,
          sentAt: email.createdAt,
          openedAt: email.openedAt,
          clickedAt: email.clickedAt,
          eventType: eventMap[email.eventId] || 'UNKNOWN'
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalEmails,
          pages: Math.ceil(totalEmails / limitNum)
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching emails:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch emails' 
    });
  }
});

export default router;
