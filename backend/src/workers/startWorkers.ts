import { logger } from '../utils/logger';
import { getRedisConfig } from '../config/env';
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { EmailJobData } from '../services/queue.service';

// Função para inicializar workers
export async function startWorkers(): Promise<void> {
  logger.info('🚀 Starting workers initialization...');
  
  try {
    // Configurar Redis
    const redisUrl = getRedisConfig();
    if (!redisUrl) {
      logger.error('Redis URL not configured!');
      throw new Error('REDIS_URL not configured');
    }
    
    logger.info('🔧 Redis URL configured, creating connection...');
    
    const redisOptions: any = {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      family: 4,
    };

    if (redisUrl.startsWith('rediss://')) {
      redisOptions.tls = {};
    }

    const connection = new IORedis(redisUrl, redisOptions);
    
    // Teste de conexão
    await connection.ping();
    logger.info('✅ Redis connection successful');

    // Criar worker inline simples para teste
    const testWorker = new Worker<EmailJobData>(
      'email-queue',
      async (job: Job<EmailJobData>) => {
        logger.info('📧 Processing job in test worker', {
          jobId: job.id,
          eventType: job.data.eventType
        });
        
        // Importar o processamento real
        const emailWorkerModule = await import('./email.worker');
        
        // Por enquanto, apenas log
        return { processed: true, jobId: job.id };
      },
      {
        connection,
        concurrency: 1,
        autorun: true,
      }
    );

    testWorker.on('ready', () => {
      logger.info('✅ Test worker is ready and running');
    });

    testWorker.on('error', (err) => {
      logger.error('❌ Test worker error', err);
    });

    logger.info('✅ Workers initialization complete');
    
    // Manter referência global para evitar garbage collection
    (global as any).__workers = { testWorker };
    
  } catch (error) {
    logger.error('❌ Failed to start workers', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

// Auto-executar se for importado
if (require.main !== module) {
  startWorkers().catch(err => {
    logger.error('Failed to auto-start workers', err);
  });
} 