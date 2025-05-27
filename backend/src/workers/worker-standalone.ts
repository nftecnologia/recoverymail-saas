#!/usr/bin/env node
import '../bootstrap'; // Para configurar os path aliases
import { logger } from '../utils/logger';
import { startWorkers } from './startWorkers';

logger.info('🚀 Starting standalone worker process...');

async function main() {
  try {
    // Iniciar apenas os workers
    await startWorkers();
    
    logger.info('✅ Worker process started successfully');
    logger.info('📧 Email worker is now processing jobs...');
    
    // Manter o processo rodando
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      process.exit(0);
    });
    
    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully...');
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Failed to start worker process', error);
    process.exit(1);
  }
}

// Executar
main(); 