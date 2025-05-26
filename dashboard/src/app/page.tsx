"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Activity, 
  Mail, 
  MousePointerClick, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Zap,
  Target,
  BarChart3,
  Users
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  // Buscar métricas
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => api.getMetrics(),
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Buscar eventos recentes
  const { data: recentEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['recent-events'],
    queryFn: () => api.getEvents({ limit: 5 }),
  });

  // Buscar emails recentes
  const { data: recentEmails, isLoading: emailsLoading } = useQuery({
    queryKey: ['recent-emails'],
    queryFn: () => api.getEmails({ limit: 5 }),
  });

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

  const statusConfig = {
    PENDING: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
    SENT: { label: "Enviado", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    DELIVERED: { label: "Entregue", color: "bg-green-500/10 text-green-600 border-green-500/20" },
    OPENED: { label: "Aberto", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
    CLICKED: { label: "Clicado", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
    BOUNCED: { label: "Rejeitado", color: "bg-red-500/10 text-red-600 border-red-500/20" },
    FAILED: { label: "Falhou", color: "bg-red-500/10 text-red-600 border-red-500/20" },
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header com gradiente */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <h1 className="text-3xl font-bold">Dashboard de Recuperação</h1>
            <p className="mt-2 text-lg text-white/80">
              Acompanhe suas métricas de recuperação de vendas em tempo real
            </p>
          </div>
          <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        </div>

        {/* Métricas principais com animação */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Taxa de Conversão */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg transition-all hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Taxa de Conversão</CardTitle>
                <div className="rounded-lg bg-green-500/10 p-2">
                  <Target className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="mt-2">
                {metricsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {metrics?.clickRate || '0'}%
                    </span>
                    <span className="text-sm font-medium text-green-600">+12%</span>
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Emails Enviados */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg transition-all hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Emails Enviados</CardTitle>
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="mt-2">
                {metricsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {metrics?.totalEmails || 0}
                    </span>
                    <span className="text-sm text-gray-500">total</span>
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Taxa de Abertura */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg transition-all hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Taxa de Abertura</CardTitle>
                <div className="rounded-lg bg-purple-500/10 p-2">
                  <Eye className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <div className="mt-2">
                {metricsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {metrics?.openRate || '0'}%
                    </span>
                    <span className="text-sm font-medium text-purple-600">+5%</span>
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Eventos Processados */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-orange-50 to-red-50 shadow-lg transition-all hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Eventos Hoje</CardTitle>
                <div className="rounded-lg bg-orange-500/10 p-2">
                  <Zap className="h-4 w-4 text-orange-600" />
                </div>
              </div>
              <div className="mt-2">
                {metricsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {metrics?.recentEvents || 0}
                    </span>
                    <span className="text-sm text-gray-500">últimos 7 dias</span>
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Gráficos e atividade recente */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Eventos Recentes */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Eventos Recentes</CardTitle>
                  <CardDescription>Últimos webhooks recebidos</CardDescription>
                </div>
                <Activity className="h-5 w-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {eventsLoading ? (
                <div className="space-y-4 p-6">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="divide-y">
                  {recentEvents?.events?.map((event: any) => (
                    <div key={event.id} className="group p-4 transition-colors hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-gray-900">
                            {eventTypeLabels[event.eventType] || event.eventType}
                          </p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(event.createdAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <Badge 
                          variant="outline"
                          className={cn(
                            "transition-colors",
                            event.status === 'PROCESSED' 
                              ? "border-green-500/20 bg-green-50 text-green-700"
                              : "border-yellow-500/20 bg-yellow-50 text-yellow-700"
                          )}
                        >
                          {event.status === 'PROCESSED' ? (
                            <CheckCircle className="mr-1 h-3 w-3" />
                          ) : (
                            <Clock className="mr-1 h-3 w-3" />
                          )}
                          {event.status === 'PROCESSED' ? 'Processado' : 'Pendente'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emails Recentes */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Emails Recentes</CardTitle>
                  <CardDescription>Últimos emails enviados</CardDescription>
                </div>
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {emailsLoading ? (
                <div className="space-y-4 p-6">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="divide-y">
                  {recentEmails?.emails?.map((email: any) => (
                    <div key={email.id} className="group p-4 transition-colors hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-gray-900">{email.subject}</p>
                          <p className="text-sm text-gray-500">
                            {email.to} • {format(new Date(email.createdAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <Badge 
                          variant="outline"
                          className={cn(
                            "transition-colors",
                            statusConfig[email.status as keyof typeof statusConfig]?.color
                          )}
                        >
                          {statusConfig[email.status as keyof typeof statusConfig]?.label || email.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
