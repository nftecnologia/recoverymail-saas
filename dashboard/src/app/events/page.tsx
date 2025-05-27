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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  RefreshCw, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock,
  Webhook,
  Activity,
  TrendingUp,
  AlertCircle,
  Download,
  Search,
  Copy,
  Check
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

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

const eventTypeColors: Record<string, string> = {
  ABANDONED_CART: "from-orange-500 to-red-500",
  PIX_EXPIRED: "from-purple-500 to-pink-500",
  BANK_SLIP_EXPIRED: "from-yellow-500 to-orange-500",
  SALE_REFUSED: "from-red-500 to-pink-500",
  SALE_APPROVED: "from-green-500 to-emerald-500",
  SALE_CHARGEBACK: "from-red-600 to-red-800",
  SALE_REFUNDED: "from-gray-500 to-gray-700",
  BANK_SLIP_GENERATED: "from-blue-500 to-indigo-500",
  PIX_GENERATED: "from-purple-500 to-indigo-500",
  SUBSCRIPTION_CANCELED: "from-orange-500 to-red-500",
  SUBSCRIPTION_EXPIRED: "from-yellow-500 to-red-500",
  SUBSCRIPTION_RENEWED: "from-green-500 to-teal-500",
};

export default function EventsPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['events', page, selectedType],
    queryFn: () => api.getEvents({ 
      page, 
      limit: 20,
      type: selectedType || undefined 
    }),
  });

  const handleRefresh = () => {
    refetch();
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header com gradiente */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-8 text-white">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                <Webhook className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Eventos Webhook</h1>
                <p className="mt-1 text-lg text-white/80">
                  Monitore todos os webhooks recebidos em tempo real
                </p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        </div>

        {/* Cards de estatísticas */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg transition-all hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total de Eventos</CardTitle>
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="mt-2">
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <span className="text-3xl font-bold text-gray-900">{data?.pagination?.total || 0}</span>
                )}
              </div>
            </CardHeader>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg transition-all hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Processados</CardTitle>
                <div className="rounded-lg bg-green-500/10 p-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="mt-2">
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <span className="text-3xl font-bold text-gray-900">
                    {data?.events?.filter(e => e.status === 'PROCESSED').length || 0}
                  </span>
                )}
              </div>
            </CardHeader>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-lg transition-all hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Pendentes</CardTitle>
                <div className="rounded-lg bg-yellow-500/10 p-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
              <div className="mt-2">
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <span className="text-3xl font-bold text-gray-900">
                    {data?.events?.filter(e => e.status === 'PENDING').length || 0}
                  </span>
                )}
              </div>
            </CardHeader>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-red-50 to-pink-50 shadow-lg transition-all hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-pink-500/5" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Com Erro</CardTitle>
                <div className="rounded-lg bg-red-500/10 p-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
              </div>
              <div className="mt-2">
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <span className="text-3xl font-bold text-gray-900">
                    {data?.events?.filter(e => e.status === 'ERROR').length || 0}
                  </span>
                )}
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Filtros e ações */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-gray-50/50">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg">Lista de Eventos</CardTitle>
                <CardDescription>Todos os webhooks recebidos pelo sistema</CardDescription>
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

          {/* Filtros por tipo */}
          <div className="border-b p-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedType === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(null)}
                className={cn(
                  "transition-all",
                  selectedType === null && "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                )}
              >
                Todos
              </Button>
              {Object.entries(eventTypeLabels).map(([type, label]) => (
                <Button
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                  className={cn(
                    "transition-all",
                    selectedType === type && `bg-gradient-to-r ${eventTypeColors[type]} text-white shadow-lg`
                  )}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-4 p-6">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">Tipo</TableHead>
                      <TableHead className="font-semibold">ID Externo</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Data</TableHead>
                      <TableHead className="font-semibold">Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.events?.map((event: any) => (
                      <TableRow key={event.id} className="group hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "h-2 w-2 rounded-full bg-gradient-to-r",
                              eventTypeColors[event.eventType] || "from-gray-400 to-gray-600"
                            )} />
                            <span className="font-medium">
                              {eventTypeLabels[event.eventType] || event.eventType}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-gray-600">
                          {event.externalId || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={cn(
                              "transition-colors",
                              event.status === 'PROCESSED' && "border-green-500/20 bg-green-50 text-green-700",
                              event.status === 'PENDING' && "border-yellow-500/20 bg-yellow-50 text-yellow-700",
                              event.status === 'ERROR' && "border-red-500/20 bg-red-50 text-red-700"
                            )}
                          >
                            {event.status === 'PROCESSED' && <CheckCircle className="mr-1 h-3 w-3" />}
                            {event.status === 'PENDING' && <Clock className="mr-1 h-3 w-3" />}
                            {event.status === 'ERROR' && <XCircle className="mr-1 h-3 w-3" />}
                            {event.status === 'PROCESSED' ? 'Processado' : 
                             event.status === 'PENDING' ? 'Pendente' : 'Erro'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {format(new Date(event.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            Ver detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Paginação */}
            {data && data.pagination.total > 20 && (
              <div className="flex items-center justify-between border-t p-4">
                <p className="text-sm text-gray-600">
                  Mostrando {((page - 1) * 20) + 1} a {Math.min(page * 20, data.pagination.total)} de {data.pagination.total} eventos
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