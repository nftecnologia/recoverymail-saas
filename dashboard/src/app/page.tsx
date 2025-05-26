"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/lib/api";
import { 
  Mail, 
  MousePointerClick, 
  Eye, 
  Send,
  TrendingUp,
  AlertCircle
} from "lucide-react";

export default function DashboardPage() {
  // Por enquanto, vamos usar dados mockados
  // Em produção, isso viria da API
  const metrics = {
    totalEvents: 14,
    totalEmails: 26,
    deliveryRate: 100,
    openRate: 85.7,
    clickRate: 42.3,
    eventsByType: {
      ABANDONED_CART: 3,
      PIX_EXPIRED: 2,
      BANK_SLIP_EXPIRED: 3,
      SALE_REFUSED: 2,
      SALE_APPROVED: 1,
      SALE_CHARGEBACK: 1,
      SALE_REFUNDED: 1,
      SUBSCRIPTION_CANCELED: 1,
    },
  };

  const cards = [
    {
      title: "Total de Eventos",
      value: metrics.totalEvents,
      description: "Webhooks recebidos",
      icon: AlertCircle,
      color: "text-blue-600",
    },
    {
      title: "Emails Enviados",
      value: metrics.totalEmails,
      description: "Total de emails processados",
      icon: Send,
      color: "text-green-600",
    },
    {
      title: "Taxa de Abertura",
      value: `${metrics.openRate}%`,
      description: "Emails abertos",
      icon: Eye,
      color: "text-purple-600",
    },
    {
      title: "Taxa de Cliques",
      value: `${metrics.clickRate}%`,
      description: "Links clicados",
      icon: MousePointerClick,
      color: "text-orange-600",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visão geral do sistema de recuperação de vendas
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Events by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Eventos por Tipo</CardTitle>
            <CardDescription>
              Distribuição dos webhooks recebidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(metrics.eventsByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    <span className="text-sm font-medium">
                      {type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>
              Últimos eventos processados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-600 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Email enviado</p>
                  <p className="text-xs text-gray-500">
                    SALE_REFUSED - nicolas.fer.oli@gmail.com
                  </p>
                </div>
                <span className="text-xs text-gray-500">2 min atrás</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Email aberto</p>
                  <p className="text-xs text-gray-500">
                    ABANDONED_CART - cliente@example.com
                  </p>
                </div>
                <span className="text-xs text-gray-500">15 min atrás</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-orange-600 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Link clicado</p>
                  <p className="text-xs text-gray-500">
                    PIX_EXPIRED - usuario@example.com
                  </p>
                </div>
                <span className="text-xs text-gray-500">1 hora atrás</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
