import { getSession } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.inboxrecovery.com';

interface ApiOptions extends RequestInit {
  organizationId?: string;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getHeaders(organizationId?: string): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Por enquanto usando org fixa, depois integrar com sessão
    headers['x-organization-id'] = organizationId || 'test-org-123';

    return headers;
  }

  async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { organizationId, ...fetchOptions } = options;
    const headers = await this.getHeaders(organizationId);

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers: {
        ...headers,
        ...fetchOptions.headers,
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
    return this.request<{
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
        organizationId: string;
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
        organizationId: string;
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
    return this.request<{
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
}

export const api = new ApiClient(API_URL);

// Tipos para as respostas da API
export interface WebhookEvent {
  id: string;
  organizationId: string;
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
  organizationId: string;
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
  async getEvents(organizationId: string = "test-org-123") {
    const response = await api.getEvents();
    return response.events;
  },

  // Emails
  async getEmails(organizationId: string = "test-org-123") {
    const response = await api.getEmails();
    return response.emails;
  },

  // Métricas
  async getMetrics(organizationId: string = "test-org-123") {
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