import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';

interface N8nWebhookPayload {
  event: any;
  metadata: {
    organizationId: string;
    eventType: string;
    attemptNumber: number;
  };
}

class N8nService {
  private baseUrl: string;
  private apiKey: string | undefined;

  constructor() {
    this.baseUrl = env.N8N_URL || 'http://localhost:5678';
    this.apiKey = env.N8N_API_KEY || undefined;
  }

  /**
   * Trigger n8n webhook para workflows customizados
   */
  async triggerWorkflow(webhookPath: string, payload: N8nWebhookPayload): Promise<void> {
    try {
      const url = `${this.baseUrl}/webhook/${webhookPath}`;
      
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'X-N8N-API-KEY': this.apiKey }),
        },
        timeout: 5000, // 5 segundos timeout
      });

      logger.info('n8n workflow triggered', {
        webhookPath,
        status: response.status,
        eventType: payload.metadata.eventType,
      });
    } catch (error) {
      // Não falhar o processo principal se n8n estiver fora
      logger.warn('Failed to trigger n8n workflow', {
        webhookPath,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Verificar se n8n está disponível
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/healthz`, {
        timeout: 2000,
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Mapear eventos para webhooks do n8n
   */
  getWebhookPath(eventType: string): string | null {
    const webhookMap: Record<string, string> = {
      // Eventos que podem se beneficiar de workflows visuais
      'SUBSCRIPTION_CANCELED': 'winback-campaign',
      'SUBSCRIPTION_EXPIRED': 'reactivation-flow',
      'SALE_CHARGEBACK': 'chargeback-handler',
      'SALE_APPROVED': 'post-purchase-flow',
      // Adicione mais conforme necessário
    };

    return webhookMap[eventType] || null;
  }
}

export const n8nService = new N8nService(); 