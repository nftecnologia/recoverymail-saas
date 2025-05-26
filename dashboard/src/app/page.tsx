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
  Eye
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DashboardPage() {
  // Buscar métricas
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => api.getMetrics(),
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Buscar eventos recentes
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['recent-events'],
    queryFn: () => api.getEvents({ limit: 5 }),
  });

  // Buscar emails recentes
  const { data: emailsData, isLoading: emailsLoading } = useQuery({
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
    PENDING: { label: "Pendente", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
    PROCESSED: { label: "Processado", icon: CheckCircle, color: "bg-green-100 text-green-800" },
    FAILED: { label: "Falhou", icon: AlertCircle, color: "bg-red-100 text-red-800" },
  };

  const emailStatusConfig = {
    PENDING: { label: "Pendente", icon: Clock, color: "bg-gray-100 text-gray-800" },
    SENT: { label: "Enviado", icon: Mail, color: "bg-blue-100 text-blue-800" },
    DELIVERED: { label: "Entregue", icon: CheckCircle, color: "bg-green-100 text-green-800" },
    OPENED: { label: "Aberto", icon: Eye, color: "bg-purple-100 text-purple-800" },
    CLICKED: { label: "Clicado", icon: MousePointerClick, color: "bg-orange-100 text-orange-800" },
    BOUNCED: { label: "Rejeitado", icon: AlertCircle, color: "bg-red-100 text-red-800" },
    FAILED: { label: "Falhou", icon: AlertCircle, color: "bg-red-100 text-red-800" },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visão geral do sistema de recuperação
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Eventos Processados
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{metrics?.processedEvents || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics?.processingRate || '0'}% de sucesso
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Emails Enviados
              </CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{metrics?.totalEmails || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics?.deliveredEmails || 0} entregues
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Taxa de Abertura
              </CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{metrics?.openRate || '0'}%</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics?.openedEmails || 0} emails abertos
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Taxa de Cliques
              </CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{metrics?.clickRate || '0'}%</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics?.clickedEmails || 0} cliques
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Recent Events */}
          <Card>
            <CardHeader>
              <CardTitle>Eventos Recentes</CardTitle>
              <CardDescription>
                Últimos webhooks recebidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {eventsData?.events.map((event) => {
                    const status = statusConfig[event.status as keyof typeof statusConfig];
                    return (
                      <div key={event.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <status.icon className={`h-4 w-4 ${status.color.split(' ')[1]}`} />
                          <div>
                            <p className="text-sm font-medium">
                              {eventTypeLabels[event.eventType] || event.eventType}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(event.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <Badge className={status.color}>
                          {status.label}
                        </Badge>
                      </div>
                    );
                  })}
                  {(!eventsData?.events || eventsData.events.length === 0) && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nenhum evento recente
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Emails */}
          <Card>
            <CardHeader>
              <CardTitle>Emails Recentes</CardTitle>
              <CardDescription>
                Últimos emails enviados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {emailsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {emailsData?.emails.map((email) => {
                    const status = emailStatusConfig[email.status as keyof typeof emailStatusConfig];
                    return (
                      <div key={email.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <status.icon className={`h-4 w-4 ${status.color.split(' ')[1]}`} />
                          <div>
                            <p className="text-sm font-medium truncate max-w-[200px]">
                              {email.to}
                            </p>
                            <p className="text-xs text-gray-500">
                              {email.event?.eventType ? eventTypeLabels[email.event.eventType] : email.template}
                            </p>
                          </div>
                        </div>
                        <Badge className={status.color}>
                          {status.label}
                        </Badge>
                      </div>
                    );
                  })}
                  {(!emailsData?.emails || emailsData.emails.length === 0) && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nenhum email recente
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
