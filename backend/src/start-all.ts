#!/usr/bin/env node
import './bootstrap'; // Para configurar os path aliases
import { logger } from './utils/logger';

logger.info('🚀 Starting Recovery Mail - API + Worker...');

async function startAll() {
  try {
    // Iniciar workers primeiro
    logger.info('📧 Starting email workers...');
    const { startWorkers } = await import('./workers/startWorkers');
    await startWorkers();
    logger.info('✅ Workers started successfully');
    
    // Pequeno delay para garantir que workers estão prontos
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Iniciar servidor
    logger.info('🌐 Starting API server...');
    await import('./server');
    
    logger.info('✅ Recovery Mail is fully operational!');
    logger.info('📍 API: Running on configured port');
    logger.info('📧 Worker: Processing email queue');
    
  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}

// Executar
startAll(); 