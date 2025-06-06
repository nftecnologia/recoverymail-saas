#!/usr/bin/env node
import './bootstrap'; // Para configurar os path aliases
import { logger } from './utils/logger';

logger.info('🚀 Starting Recovery Mail - API with Trigger.dev...');

async function startAll() {
  try {
    // Iniciar servidor (Trigger.dev gerencia os workers)
    logger.info('🌐 Starting API server...');
    await import('./server');
    
    logger.info('✅ Recovery Mail is fully operational!');
    logger.info('📍 API: Running on configured port');
    logger.info('📧 Jobs: Processed by Trigger.dev cloud infrastructure');
    
  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}

// Executar
startAll(); 