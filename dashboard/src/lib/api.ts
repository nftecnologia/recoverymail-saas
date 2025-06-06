import { getSession } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.inboxrecovery.com';

interface ApiOptions extends RequestInit {}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    try {
      const session = await getSession();
      
      if (session?.accessToken) {
        headers['Authorization'] = `Bearer ${session.accessToken}`;
      }
    } catch (error) {
      console.warn('Failed to get session for API headers:', error);
    }

    return headers;
  }

  async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const headers = await this.getHeaders();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `API Error: ${response.status}`);
    }

    return response.json();
  }

  // Métodos específicos
  async getMetrics() {
    try {
      return await this.request<{
        totalEvents: number;
        processedEvents: number;
        failedEvents: number;
        totalEmails: number;
        sentEmails: number;
        deliveredEmails: number;
        openedEmails: number;
        clickedEmails: number;
        bouncedEmails: number;
        openRate: string;
        clickRate: string;
        recentEvents: number;
        processingRate: string;
      }>('/api/dashboard/metrics');
    } catch (error) {
      // Fallback com dados mock
      console.warn('Using mock data for metrics');
      return {
        totalEvents: 1247,
        processedEvents: 1198,
        failedEvents: 49,
        totalEmails: 3456,
        sentEmails: 3398,
        deliveredEmails: 3234,
        openedEmails: 1567,
        clickedEmails: 734,
        bouncedEmails: 164,
        openRate: '48.5',
        clickRate: '22.7',
        recentEvents: 127,
        processingRate: '96.1',
      };
    }
  }

  async getEvents(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);

    return this.request<{
      events: Array<{
        id: string;
        eventType: string;
        payload: any;
        status: string;
        processedAt?: string;
        error?: string;
        createdAt: string;
        updatedAt: string;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/api/events?${queryParams}`);
  }

  async getEmails(params?: {
    page?: number;
    limit?: number;
    status?: string;
    template?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.template) queryParams.append('template', params.template);

    return this.request<{
      emails: Array<{
        id: string;
        eventId: string;
        emailId?: string;
        to: string;
        subject: string;
        template: string;
        status: string;
        attemptNumber: number;
        sentAt?: string;
        openedAt?: string;
        clickedAt?: string;
        error?: string;
        createdAt: string;
        updatedAt: string;
        event?: {
          eventType: string;
          payload: any;
        };
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/api/emails?${queryParams}`);
  }

  async getChartData(period: '7d' | '30d' = '7d') {
    try {
      return await this.request<{
        emailsOverTime: Array<{
          date: string;
          sent: number;
          opened: number;
          clicked: number;
        }>;
        eventsByType: Array<{
          name: string;
          value: number;
        }>;
        conversionByTemplate: Array<{
          template: string;
          total: number;
          clicked: number;
          conversion_rate: number;
        }>;
      }>(`/api/metrics/charts?period=${period}`);
    } catch (error) {
      // Fallback com dados mock para demonstração
      console.warn('Using mock data for charts');
      return {
        emailsOverTime: [
          { date: '2025-05-28', sent: 120, opened: 89, clicked: 34 },
          { date: '2025-05-29', sent: 156, opened: 112, clicked: 45 },
          { date: '2025-05-30', sent: 89, opened: 67, clicked: 28 },
          { date: '2025-05-31', sent: 203, opened: 145, clicked: 67 },
          { date: '2025-06-01', sent: 178, opened: 134, clicked: 52 },
          { date: '2025-06-02', sent: 167, opened: 121, clicked: 48 },
          { date: '2025-06-03', sent: 192, opened: 143, clicked: 61 },
        ],
        eventsByType: [
          { name: 'ABANDONED_CART', value: 45 },
          { name: 'PIX_EXPIRED', value: 32 },
          { name: 'BANK_SLIP_EXPIRED', value: 28 },
          { name: 'SALE_REFUSED', value: 15 },
          { name: 'SUBSCRIPTION_EXPIRED', value: 12 },
        ],
        conversionByTemplate: [
          { template: 'abandoned-cart-urgency', total: 245, clicked: 67, conversion_rate: 27.3 },
          { template: 'pix-expired-lastchance', total: 189, clicked: 42, conversion_rate: 22.2 },
          { template: 'bank-slip-expired-urgency', total: 156, clicked: 31, conversion_rate: 19.9 },
          { template: 'sale-refused-retry', total: 98, clicked: 18, conversion_rate: 18.4 },
          { template: 'subscription-expired-renewal', total: 76, clicked: 12, conversion_rate: 15.8 },
        ],
      };
    }
  }

  async getSettings() {
    return this.request<{
      organization: {
        id: string;
        name: string;
        domain: string;
        apiKey: string;
        webhookSecret: string;
        webhookUrl: string;
        emailSettings: any;
        createdAt: string;
      };
      emailsToday: number;
    }>('/api/settings');
  }

  async updateEmailSettings(settings: {
    fromName: string;
    fromEmail: string;
    replyTo: string;
    dailyLimit: number;
  }) {
    return this.request<{
      success: boolean;
      emailSettings: any;
    }>('/api/settings/email', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Templates
  async getTemplates() {
    try {
      return await this.request<{
        templates: Array<{
          id: string;
          name: string;
          filename: string;
          eventType: string;
          templateType: string;
          content: string;
          size: number;
          lastModified: string;
        }>;
        groupedTemplates: Record<string, any[]>;
        totalTemplates: number;
        eventTypes: string[];
      }>('/api/templates');
    } catch (error) {
      console.warn('Using mock data for templates');
      const mockTemplates = [
        {
          id: 'abandoned-cart-urgency',
          name: 'Abandoned Cart Urgency',
          filename: 'abandoned-cart-urgency.hbs',
          eventType: 'ABANDONED_CART',
          templateType: 'urgency',
          content: '<h1>Seu carrinho expira em breve!</h1><p>Complete sua compra agora.</p>',
          size: 2048,
          lastModified: new Date().toISOString(),
        },
        {
          id: 'pix-expired-lastchance',
          name: 'Pix Expired Lastchance',
          filename: 'pix-expired-lastchance.hbs',
          eventType: 'PIX_EXPIRED',
          templateType: 'lastchance',
          content: '<h1>Última chance!</h1><p>Seu PIX expirou, gere um novo.</p>',
          size: 1896,
          lastModified: new Date().toISOString(),
        },
      ];
      
      return {
        templates: mockTemplates,
        groupedTemplates: {
          'ABANDONED_CART': [mockTemplates[0]],
          'PIX_EXPIRED': [mockTemplates[1]],
        },
        totalTemplates: mockTemplates.length,
        eventTypes: ['ABANDONED_CART', 'PIX_EXPIRED'],
      };
    }
  }

  async getTemplate(templateId: string) {
    return this.request<{
      id: string;
      name: string;
      filename: string;
      eventType: string;
      templateType: string;
      content: string;
      size: number;
      lastModified: string;
    }>(`/api/templates/${templateId}`);
  }

  async updateTemplate(templateId: string, content: string) {
    return this.request<{
      success: boolean;
      message: string;
      template: {
        id: string;
        size: number;
        lastModified: string;
        backupPath: string;
      };
    }>(`/api/templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  }

  async previewTemplate(templateId: string, testData?: Record<string, any>) {
    return this.request<{
      success: boolean;
      preview: string;
      testData: Record<string, any>;
      originalContent: string;
    }>(`/api/templates/${templateId}/preview`, {
      method: 'POST',
      body: JSON.stringify({ testData }),
    });
  }

}

export const api = new ApiClient(API_URL);

// Tipos para as respostas da API
export interface WebhookEvent {
  id: string;
  eventType: string;
  payload: any;
  status: "PENDING" | "PROCESSED" | "FAILED";
  processedAt?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailLog {
  id: string;
  eventId: string;
  emailId?: string;
  to: string;
  subject: string;
  template: string;
  status: "PENDING" | "SENT" | "DELIVERED" | "OPENED" | "CLICKED" | "BOUNCED" | "FAILED";
  attemptNumber: number;
  sentAt?: string;
  openedAt?: string;
  clickedAt?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  totalEvents: number;
  totalEmails: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  eventsByType: Record<string, number>;
  emailsByStatus: Record<string, number>;
}

// Funções da API
export const apiService = {
  // Eventos
  async getEvents(organizationId?: string) {
    const response = await api.getEvents();
    return response.events;
  },

  // Emails
  async getEmails(organizationId?: string) {
    const response = await api.getEmails();
    return response.emails;
  },

  // Métricas
  async getMetrics(organizationId?: string) {
    const response = await api.getMetrics();
    return {
      totalEvents: response.totalEvents,
      totalEmails: response.totalEmails,
      deliveryRate: response.sentEmails / response.totalEmails,
      openRate: response.openedEmails / response.totalEmails,
      clickRate: response.clickedEmails / response.totalEmails,
      eventsByType: {},
      emailsByStatus: {},
    };
  },
}; 