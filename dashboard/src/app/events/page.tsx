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

// Dados mockados por enquanto
const mockEvents = [
  {
    id: "cmb594fx50001mcxrkb1foseg",
    organizationId: "test-org-123",
    eventType: "ABANDONED_CART",
    status: "PROCESSED",
    processedAt: "2025-05-26T14:37:51.000Z",
    createdAt: "2025-05-26T14:37:50.000Z",
    payload: {
      customer: { name: "João Silva", email: "joao@example.com" },
      total_price: "R$ 297,00"
    }
  },
  {
    id: "cmb5chho10001mcw9jlibvxje",
    organizationId: "test-org-123",
    eventType: "SALE_REFUSED",
    status: "PROCESSED",
    processedAt: "2025-05-26T14:12:00.000Z",
    createdAt: "2025-05-26T14:11:59.000Z",
    payload: {
      customer: { name: "Nicolas Oliveira", email: "nicolas.fer.oli@gmail.com" },
      total_price: "R$ 497,00"
    }
  },
  {
    id: "cmb5b3do20003mcuz0tfjo4j1",
    organizationId: "test-org-123",
    eventType: "PIX_EXPIRED",
    status: "FAILED",
    error: "Template not found",
    createdAt: "2025-05-26T13:45:00.000Z",
    payload: {
      customer: { name: "Maria Santos", email: "maria@example.com" },
      total_price: "R$ 197,00"
    }
  },
  {
    id: "cmb5b3do20004mcuz0tfjo4j2",
    organizationId: "test-org-123",
    eventType: "BANK_SLIP_EXPIRED",
    status: "PENDING",
    createdAt: "2025-05-26T13:30:00.000Z",
    payload: {
      customer: { name: "Pedro Costa", email: "pedro@example.com" },
      total_price: "R$ 997,00"
    }
  }
];

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

  const filteredEvents = mockEvents.filter(event => {
    if (selectedType && event.eventType !== selectedType) return false;
    if (selectedStatus && event.status !== selectedStatus) return false;
    return true;
  });

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
          <Button variant="outline" size="sm">
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
                onClick={() => setSelectedType(null)}
              >
                Todos os tipos
              </Button>
              {Object.entries(eventTypeLabels).map(([type, label]) => (
                <Button
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant={selectedStatus === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus(null)}
              >
                Todos os status
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
          </CardContent>
        </Card>

        {/* Events Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Eventos</CardTitle>
            <CardDescription>
              {filteredEvents.length} eventos encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                {filteredEvents.map((event) => {
                  const status = statusConfig[event.status as keyof typeof statusConfig];
                  return (
                    <TableRow key={event.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {eventTypeLabels[event.eventType] || event.eventType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{event.payload.customer.name}</p>
                          <p className="text-sm text-gray-500">{event.payload.customer.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{event.payload.total_price}</TableCell>
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 