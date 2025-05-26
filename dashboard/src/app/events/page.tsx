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
import { RefreshCw, Filter, CheckCircle, XCircle, Clock } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

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
  FAILED: { label: "Falhou", icon: XCircle, color: "bg-red-100 text-red-800" },
};

export default function EventsPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['events', page, selectedType, selectedStatus],
    queryFn: () => api.getEvents({
      page,
      limit: 20,
      type: selectedType || undefined,
      status: selectedStatus || undefined,
    }),
  });

  const handleRefresh = () => {
    refetch();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Eventos
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Webhooks recebidos e processados
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
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
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedType === null ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedType(null);
                  setPage(1);
                }}
              >
                Todos os tipos
              </Button>
              {Object.entries(eventTypeLabels).map(([type, label]) => (
                <Button
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedType(type);
                    setPage(1);
                  }}
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant={selectedStatus === null ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedStatus(null);
                  setPage(1);
                }}
              >
                Todos os status
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
          </CardContent>
        </Card>

        {/* Events Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Eventos</CardTitle>
            <CardDescription>
              {data?.pagination.total || 0} eventos encontrados
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
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.events.map((event) => {
                      const status = statusConfig[event.status as keyof typeof statusConfig];
                      const customer = event.payload?.customer || {};
                      const totalPrice = event.payload?.total_price || event.payload?.value || '-';
                      
                      return (
                        <TableRow key={event.id}>
                          <TableCell>
                            <Badge variant="outline">
                              {eventTypeLabels[event.eventType] || event.eventType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{customer.name || 'N/A'}</p>
                              <p className="text-sm text-gray-500">{customer.email || 'N/A'}</p>
                            </div>
                          </TableCell>
                          <TableCell>{totalPrice}</TableCell>
                          <TableCell>
                            <Badge className={status.color}>
                              <status.icon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(event.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              Ver detalhes
                            </Button>
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