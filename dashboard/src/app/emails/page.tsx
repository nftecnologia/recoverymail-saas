"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Mail, 
  Send, 
  CheckCircle, 
  Eye, 
  MousePointerClick,
  XCircle,
  Clock,
  RefreshCw,
  Filter
} from "lucide-react";
import { useState } from "react";

// Dados mockados
const mockEmails = [
  {
    id: "cmb5chjbg0003mcw900txuaki",
    organizationId: "test-org-123",
    eventId: "cmb5chho10001mcw9jlibvxje",
    emailId: "a57b9463-9eb5-4d8b-bce1-ed5d33bf0e96",
    to: "nicolas.fer.oli@gmail.com",
    subject: "❌ Pagamento não aprovado - Tente novamente",
    template: "sale-refused-retry",
    status: "CLICKED",
    attemptNumber: 1,
    sentAt: "2025-05-26T17:12:00.268Z",
    openedAt: "2025-05-26T17:15:09.607Z",
    clickedAt: "2025-05-26T17:16:27.166Z",
    createdAt: "2025-05-26T17:12:00.269Z"
  },
  {
    id: "cmb5b3do20005mcuz0tfjo4j3",
    organizationId: "test-org-123",
    eventId: "cmb594fx50001mcxrkb1foseg",
    to: "joao@example.com",
    subject: "🛒 Você esqueceu alguns itens no carrinho",
    template: "abandoned-cart-reminder",
    status: "OPENED",
    attemptNumber: 1,
    sentAt: "2025-05-26T16:40:00.000Z",
    openedAt: "2025-05-26T16:45:00.000Z",
    createdAt: "2025-05-26T16:40:00.000Z"
  },
  {
    id: "cmb5b3do20006mcuz0tfjo4j4",
    organizationId: "test-org-123",
    eventId: "cmb5b3do20003mcuz0tfjo4j1",
    to: "maria@example.com",
    subject: "⏰ Seu PIX está expirando!",
    template: "pix-expired-urgent",
    status: "DELIVERED",
    attemptNumber: 1,
    sentAt: "2025-05-26T15:30:00.000Z",
    createdAt: "2025-05-26T15:30:00.000Z"
  },
  {
    id: "cmb5b3do20007mcuz0tfjo4j5",
    organizationId: "test-org-123",
    eventId: "cmb5b3do20004mcuz0tfjo4j2",
    to: "pedro@example.com",
    subject: "📄 Seu boleto venceu - Gere um novo",
    template: "bank-slip-expired",
    status: "BOUNCED",
    attemptNumber: 1,
    sentAt: "2025-05-26T14:00:00.000Z",
    error: "Email bounced",
    createdAt: "2025-05-26T14:00:00.000Z"
  },
  {
    id: "cmb5b3do20008mcuz0tfjo4j6",
    organizationId: "test-org-123",
    eventId: "cmb5b3do20004mcuz0tfjo4j2",
    to: "ana@example.com",
    subject: "✅ Pagamento aprovado! Acesse seu curso",
    template: "sale-approved-confirmation",
    status: "SENT",
    attemptNumber: 1,
    sentAt: "2025-05-26T13:00:00.000Z",
    createdAt: "2025-05-26T13:00:00.000Z"
  }
];

const statusConfig = {
  PENDING: { label: "Pendente", icon: Clock, color: "bg-gray-100 text-gray-800" },
  SENT: { label: "Enviado", icon: Send, color: "bg-blue-100 text-blue-800" },
  DELIVERED: { label: "Entregue", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  OPENED: { label: "Aberto", icon: Eye, color: "bg-purple-100 text-purple-800" },
  CLICKED: { label: "Clicado", icon: MousePointerClick, color: "bg-orange-100 text-orange-800" },
  BOUNCED: { label: "Rejeitado", icon: XCircle, color: "bg-red-100 text-red-800" },
  FAILED: { label: "Falhou", icon: XCircle, color: "bg-red-100 text-red-800" },
};

const templateLabels: Record<string, string> = {
  "abandoned-cart-reminder": "Lembrete de Carrinho",
  "abandoned-cart-urgency": "Carrinho - Urgência",
  "abandoned-cart-discount": "Carrinho - Desconto",
  "sale-refused-retry": "Pagamento Recusado - Retry",
  "sale-refused-support": "Pagamento Recusado - Suporte",
  "pix-expired-urgent": "PIX Expirado - Urgente",
  "pix-expired-new": "PIX Expirado - Novo",
  "bank-slip-expired": "Boleto Expirado",
  "sale-approved-confirmation": "Venda Aprovada",
};

export default function EmailsPage() {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const filteredEmails = mockEmails.filter(email => {
    if (selectedStatus && email.status !== selectedStatus) return false;
    if (selectedTemplate && email.template !== selectedTemplate) return false;
    return true;
  });

  // Calcular métricas
  const metrics = {
    total: mockEmails.length,
    sent: mockEmails.filter(e => e.status === "SENT").length,
    delivered: mockEmails.filter(e => e.status === "DELIVERED").length,
    opened: mockEmails.filter(e => e.status === "OPENED").length,
    clicked: mockEmails.filter(e => e.status === "CLICKED").length,
    bounced: mockEmails.filter(e => e.status === "BOUNCED").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Emails
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Histórico de emails enviados
            </p>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-6">
          {Object.entries(statusConfig).map(([status, config]) => {
            const count = metrics[status.toLowerCase() as keyof typeof metrics] || 0;
            return (
              <Card key={status}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <config.icon className="h-4 w-4 mr-2" />
                    {config.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{count}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Status</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedStatus === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStatus(null)}
                  >
                    Todos
                  </Button>
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <Button
                      key={status}
                      variant={selectedStatus === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedStatus(status)}
                    >
                      <config.icon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Template</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedTemplate === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTemplate(null)}
                  >
                    Todos
                  </Button>
                  {Object.entries(templateLabels).map(([template, label]) => (
                    <Button
                      key={template}
                      variant={selectedTemplate === template ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emails Table */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Emails</CardTitle>
            <CardDescription>
              {filteredEmails.length} emails encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Destinatário</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enviado em</TableHead>
                  <TableHead>Interações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmails.map((email) => {
                  const status = statusConfig[email.status as keyof typeof statusConfig];
                  return (
                    <TableRow key={email.id}>
                      <TableCell>
                        <p className="font-medium">{email.to}</p>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {email.subject}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {templateLabels[email.template] || email.template}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={status.color}>
                          <status.icon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(email.sentAt || email.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          {email.openedAt && (
                            <span className="flex items-center text-purple-600">
                              <Eye className="h-3 w-3 mr-1" />
                              {format(new Date(email.openedAt), "HH:mm")}
                            </span>
                          )}
                          {email.clickedAt && (
                            <span className="flex items-center text-orange-600">
                              <MousePointerClick className="h-3 w-3 mr-1" />
                              {format(new Date(email.clickedAt), "HH:mm")}
                            </span>
                          )}
                          {email.error && (
                            <span className="text-red-600">
                              {email.error}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 