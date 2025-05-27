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
  Filter,
  Download,
  TrendingUp,
  AlertCircle,
  MailOpen,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const statusConfig = {
  PENDING: { 
    label: "Pendente", 
    icon: Clock, 
    color: "border-yellow-500/20 bg-yellow-50 text-yellow-700",
    gradient: "from-yellow-500 to-orange-500"
  },
  SENT: { 
    label: "Enviado", 
    icon: Send, 
    color: "border-blue-500/20 bg-blue-50 text-blue-700",
    gradient: "from-blue-500 to-indigo-500"
  },
  DELIVERED: { 
    label: "Entregue", 
    icon: CheckCircle, 
    color: "border-green-500/20 bg-green-50 text-green-700",
    gradient: "from-green-500 to-emerald-500"
  },
  OPENED: { 
    label: "Aberto", 
    icon: Eye, 
    color: "border-purple-500/20 bg-purple-50 text-purple-700",
    gradient: "from-purple-500 to-pink-500"
  },
  CLICKED: { 
    label: "Clicado", 
    icon: MousePointerClick, 
    color: "border-indigo-500/20 bg-indigo-50 text-indigo-700",
    gradient: "from-indigo-500 to-purple-500"
  },
  BOUNCED: { 
    label: "Rejeitado", 
    icon: XCircle, 
    color: "border-red-500/20 bg-red-50 text-red-700",
    gradient: "from-red-500 to-pink-500"
  },
  FAILED: { 
    label: "Falhou", 
    icon: AlertCircle, 
    color: "border-red-500/20 bg-red-50 text-red-700",
    gradient: "from-red-600 to-red-800"
  },
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

  // Calcular estatísticas
  const stats = {
    sent: data?.emails?.filter(e => e.status === 'SENT').length || 0,
    delivered: data?.emails?.filter(e => e.status === 'DELIVERED').length || 0,
    opened: data?.emails?.filter(e => e.status === 'OPENED').length || 0,
    clicked: data?.emails?.filter(e => e.status === 'CLICKED').length || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header com gradiente */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 text-white">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Central de Emails</h1>
                <p className="mt-1 text-lg text-white/80">
                  Acompanhe o desempenho das suas campanhas de recuperação
                </p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <Sparkles className="absolute right-8 top-8 h-8 w-8 text-white/20" />
        </div>

        {/* Cards de estatísticas */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg transition-all hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Enviados</CardTitle>
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <Send className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="mt-2">
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">{stats.sent}</span>
                    <span className="text-sm font-medium text-blue-600">emails</span>
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg transition-all hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Entregues</CardTitle>
                <div className="rounded-lg bg-green-500/10 p-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="mt-2">
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">{stats.delivered}</span>
                    <span className="text-sm text-gray-500">
                      {stats.sent > 0 ? `(${Math.round((stats.delivered / stats.sent) * 100)}%)` : ''}
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg transition-all hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Abertos</CardTitle>
                <div className="rounded-lg bg-purple-500/10 p-2">
                  <Eye className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <div className="mt-2">
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">{stats.opened}</span>
                    <span className="text-sm text-gray-500">
                      {stats.delivered > 0 ? `(${Math.round((stats.opened / stats.delivered) * 100)}%)` : ''}
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg transition-all hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Clicados</CardTitle>
                <div className="rounded-lg bg-indigo-500/10 p-2">
                  <MousePointerClick className="h-4 w-4 text-indigo-600" />
                </div>
              </div>
              <div className="mt-2">
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">{stats.clicked}</span>
                    <span className="text-sm text-gray-500">
                      {stats.opened > 0 ? `(${Math.round((stats.clicked / stats.opened) * 100)}%)` : ''}
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Lista de emails */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-gray-50/50">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg">Histórico de Emails</CardTitle>
                <CardDescription>Todos os emails enviados pelo sistema</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="gap-2 border-gray-200 hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Atualizar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-gray-200 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Filtros por status */}
          <div className="border-b p-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedStatus === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus(null)}
                className={cn(
                  "transition-all",
                  selectedStatus === null && "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                )}
              >
                Todos
              </Button>
              {Object.entries(statusConfig).map(([status, config]) => {
                const Icon = config.icon;
                return (
                  <Button
                    key={status}
                    variant={selectedStatus === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStatus(status)}
                    className={cn(
                      "gap-2 transition-all",
                      selectedStatus === status && `bg-gradient-to-r ${config.gradient} text-white shadow-lg`
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {config.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-4 p-6">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">Destinatário</TableHead>
                      <TableHead className="font-semibold">Assunto</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Tentativa</TableHead>
                      <TableHead className="font-semibold">Enviado em</TableHead>
                      <TableHead className="font-semibold">Interações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.emails?.map((email: any) => {
                      const status = statusConfig[email.status as keyof typeof statusConfig];
                      const Icon = status?.icon || Mail;
                      
                      return (
                        <TableRow key={email.id} className="group hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{email.to}</p>
                              <p className="text-sm text-gray-500">ID: {email.emailId || '-'}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="max-w-xs truncate font-medium">{email.subject}</p>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline"
                              className={cn("gap-1 transition-colors", status?.color)}
                            >
                              <Icon className="h-3 w-3" />
                              {status?.label || email.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {email.attemptNumber}/3
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {email.sentAt ? 
                              format(new Date(email.sentAt), "dd/MM 'às' HH:mm", { locale: ptBR }) : 
                              '-'
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3 text-sm">
                              {email.openedAt && (
                                <div className="flex items-center gap-1 text-purple-600">
                                  <Eye className="h-3 w-3" />
                                  <span>{format(new Date(email.openedAt), "HH:mm")}</span>
                                </div>
                              )}
                              {email.clickedAt && (
                                <div className="flex items-center gap-1 text-indigo-600">
                                  <MousePointerClick className="h-3 w-3" />
                                  <span>{format(new Date(email.clickedAt), "HH:mm")}</span>
                                </div>
                              )}
                              {!email.openedAt && !email.clickedAt && (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Paginação */}
            {data && data.pagination.total > 20 && (
              <div className="flex items-center justify-between border-t p-4">
                <p className="text-sm text-gray-600">
                  Mostrando {((page - 1) * 20) + 1} a {Math.min(page * 20, data.pagination.total)} de {data.pagination.total} emails
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page * 20 >= data.pagination.total}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 