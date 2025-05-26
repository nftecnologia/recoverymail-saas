import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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
    const response = await api.get<WebhookEvent[]>(`/api/events/${organizationId}`);
    return response.data;
  },

  // Emails
  async getEmails(organizationId: string = "test-org-123") {
    const response = await api.get<EmailLog[]>(`/api/emails/${organizationId}`);
    return response.data;
  },

  // Métricas
  async getMetrics(organizationId: string = "test-org-123") {
    const response = await api.get<DashboardMetrics>(`/api/metrics/${organizationId}`);
    return response.data;
  },
}; 