import { logger } from '../utils/logger';
import './email.worker';

logger.info('Workers module loaded');

// Aqui podemos adicionar outros workers no futuro
// import './notification.worker';
// import './analytics.worker'; 