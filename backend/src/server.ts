import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/middleware/error.middleware';
import { testDatabaseConnection } from '@/config/database';
import webhookRoutes from '@/routes/webhook.routes';
import resendWebhookRoutes from '@/routes/resend-webhook.routes';
import { cleanOldJobs } from '@/services/queue.service';

// Criar app Express
const app = express();

// Middleware de segurança
app.use(helmet());
app.use(cors({
  origin: env.NODE_ENV === 'production' 
    ? env.FRONTEND_URL 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Compressão
app.use(compression());

// Logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

// Rate limiting global
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de requisições
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health check
app.get('/health', async (req, res) => {
  const dbHealthy = await testDatabaseConnection();
  
  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: dbHealthy ? 'connected' : 'disconnected',
    },
  });
});

// Rotas principais
app.get('/', (_req, res) => {
  res.json({
    name: 'Recovery SaaS API',
    version: '1.0.0',
    docs: '/api-docs',
  });
});

// Rotas de webhook
app.use('/webhook', webhookRoutes);

// Rotas de webhook do Resend (tracking de emails)
app.use('/', resendWebhookRoutes);

// Middleware de erro (deve ser o último)
app.use(errorHandler);

// Inicialização do servidor
async function startServer() {
  try {
    // Testar conexão com banco
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }

    // Limpar jobs antigos a cada hora
    setInterval(async () => {
      try {
        await cleanOldJobs();
      } catch (error) {
        logger.error('Failed to clean old jobs', error);
      }
    }, 60 * 60 * 1000);

    // Iniciar workers
    await import('./workers');
    logger.info('Workers initialized');

    // Iniciar servidor
    const server = app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info(`Webhook endpoint: ${env.API_URL}/webhook/:orgId`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, starting graceful shutdown`);
      
      server.close(() => {
        logger.info('HTTP server closed');
      });
      
      // Aguardar jobs em processamento
      setTimeout(() => {
        process.exit(0);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar servidor se não estiver em modo de teste
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app; 