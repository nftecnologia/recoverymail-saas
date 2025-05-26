"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

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

const eventTypeLabels: Record<string, string> = {
  ABANDONED_CART: "Carrinho Abandonado",
  PIX_EXPIRED: "PIX Expirado",
  BANK_SLIP_EXPIRED: "Boleto Expirado",
  SALE_REFUSED: "Venda Recusada",
  SALE_APPROVED: "Venda Aprovada",
  SALE_CHARGEBACK: "Chargeback",
  SALE_REFUNDED: "Reembolso",
  BANK_SLIP_GENERATED: "Boleto Gerado",
  PIX_GENERATED: "PIX Gerado",
  SUBSCRIPTION_CANCELED: "Assinatura Cancelada",
  SUBSCRIPTION_EXPIRED: "Assinatura Expirada",
  SUBSCRIPTION_RENEWED: "Assinatura Renovada",
};

export default function EmailsPage() {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['emails', page, selectedStatus, selectedTemplate],
    queryFn: () => api.getEmails({
      page,
      limit: 20,
      status: selectedStatus || undefined,
      template: selectedTemplate || undefined,
    }),
  });

  // Buscar métricas de email
  const { data: metrics } = useQuery({
    queryKey: ['email-metrics'],
    queryFn: () => api.getMetrics(),
  });

  const handleRefresh = () => {
    refetch();
  };

  // Extrair templates únicos dos emails
  const uniqueTemplates = data?.emails
    ? Array.from(new Set(data.emails.map(e => e.template)))
    : [];

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
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-6">
          {Object.entries(statusConfig).map(([status, config]) => {
            let count = 0;
            if (status === 'SENT') count = metrics?.sentEmails || 0;
            else if (status === 'DELIVERED') count = metrics?.deliveredEmails || 0;
            else if (status === 'OPENED') count = metrics?.openedEmails || 0;
            else if (status === 'CLICKED') count = metrics?.clickedEmails || 0;
            else if (status === 'BOUNCED') count = metrics?.bouncedEmails || 0;
            
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
                    onClick={() => {
                      setSelectedStatus(null);
                      setPage(1);
                    }}
                  >
                    Todos
                  </Button>
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <Button
                      key={status}
                      variant={selectedStatus === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedStatus(status);
                        setPage(1);
                      }}
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
                    onClick={() => {
                      setSelectedTemplate(null);
                      setPage(1);
                    }}
                  >
                    Todos
                  </Button>
                  {uniqueTemplates.map((template) => (
                    <Button
                      key={template}
                      variant={selectedTemplate === template ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setPage(1);
                      }}
                    >
                      {templateLabels[template] || template}
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
              {data?.pagination.total || 0} emails encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <>
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
                    {data?.emails.map((email) => {
                      const status = statusConfig[email.status as keyof typeof statusConfig];
                      return (
                        <TableRow key={email.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{email.to}</p>
                              {email.event && (
                                <p className="text-xs text-gray-500">
                                  {eventTypeLabels[email.event.eventType] || email.event.eventType}
                                </p>
                              )}
                            </div>
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

                {/* Pagination */}
                {data && data.pagination.pages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-500">
                      Página {data.pagination.page} de {data.pagination.pages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page === data.pagination.pages}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 