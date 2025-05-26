const { Queue } = require('bullmq');
const IORedis = require('ioredis');

// Conectar ao Redis
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: redisUrl.startsWith('rediss://') ? {} : undefined,
  family: 4,
});

const emailQueue = new Queue('email-queue', { connection });

async function checkQueueStatus() {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      emailQueue.getWaitingCount(),
      emailQueue.getActiveCount(),
      emailQueue.getCompletedCount(),
      emailQueue.getFailedCount(),
      emailQueue.getDelayedCount(),
    ]);

    console.log('📊 Status da Fila de Emails:');
    console.log('--------------------------------');
    console.log(`⏳ Aguardando: ${waiting}`);
    console.log(`🔄 Processando: ${active}`);
    console.log(`✅ Completos: ${completed}`);
    console.log(`❌ Falhas: ${failed}`);
    console.log(`⏰ Agendados: ${delayed}`);
    console.log('--------------------------------');
    console.log(`📬 Total: ${waiting + active + completed + failed + delayed}`);

    // Listar jobs agendados
    if (delayed > 0) {
      const delayedJobs = await emailQueue.getDelayed();
      console.log('\n📅 Jobs Agendados:');
      for (const job of delayedJobs.slice(0, 5)) {
        const delay = job.opts.delay || 0;
        const processAt = new Date(job.timestamp + delay);
        console.log(`- Job ${job.id}: será processado em ${processAt.toLocaleString('pt-BR')}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar fila:', error);
  } finally {
    await emailQueue.close();
    connection.disconnect();
  }
}

checkQueueStatus(); 