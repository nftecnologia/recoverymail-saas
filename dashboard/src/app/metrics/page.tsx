"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Activity, DollarSign } from "lucide-react";

// Dados mockados para os gráficos
const emailsOverTime = [
  { date: "20/05", enviados: 45, abertos: 38, clicados: 12 },
  { date: "21/05", enviados: 52, abertos: 41, clicados: 18 },
  { date: "22/05", enviados: 38, abertos: 30, clicados: 8 },
  { date: "23/05", enviados: 65, abertos: 55, clicados: 25 },
  { date: "24/05", enviados: 48, abertos: 42, clicados: 20 },
  { date: "25/05", enviados: 72, abertos: 68, clicados: 35 },
  { date: "26/05", enviados: 26, abertos: 22, clicados: 11 },
];

const eventsByType = [
  { name: "Carrinho Abandonado", value: 35, color: "#3B82F6" },
  { name: "PIX Expirado", value: 20, color: "#8B5CF6" },
  { name: "Boleto Expirado", value: 25, color: "#F59E0B" },
  { name: "Venda Recusada", value: 15, color: "#EF4444" },
  { name: "Outros", value: 5, color: "#6B7280" },
];

const conversionByTemplate = [
  { template: "Carrinho - Lembrete", taxa: 12.5 },
  { template: "Carrinho - Urgência", taxa: 18.3 },
  { template: "Carrinho - Desconto", taxa: 32.7 },
  { template: "PIX - Urgente", taxa: 45.2 },
  { template: "Boleto - Novo", taxa: 22.8 },
  { template: "Pagamento - Retry", taxa: 28.5 },
];

const revenueRecovered = [
  { mes: "Janeiro", valor: 12500 },
  { mes: "Fevereiro", valor: 18300 },
  { mes: "Março", valor: 22700 },
  { mes: "Abril", valor: 31200 },
  { mes: "Maio", valor: 28500 },
];

export default function MetricsPage() {
  // Métricas calculadas
  const totalRecovered = revenueRecovered.reduce((acc, curr) => acc + curr.valor, 0);
  const avgConversionRate = conversionByTemplate.reduce((acc, curr) => acc + curr.taxa, 0) / conversionByTemplate.length;
  const totalEmailsSent = emailsOverTime.reduce((acc, curr) => acc + curr.enviados, 0);
  const avgOpenRate = (emailsOverTime.reduce((acc, curr) => acc + curr.abertos, 0) / totalEmailsSent * 100).toFixed(1);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Métricas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Análise detalhada de performance
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Receita Recuperada
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {totalRecovered.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                +23% vs mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Taxa de Conversão Média
              </CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {avgConversionRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                +5.2% vs mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Emails Enviados
              </CardTitle>
              <Activity className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEmailsSent}</div>
              <p className="text-xs text-muted-foreground">
                Últimos 7 dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Taxa de Abertura
              </CardTitle>
              <Activity className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgOpenRate}%</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                -2.1% vs mês anterior
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="emails" className="space-y-4">
          <TabsList>
            <TabsTrigger value="emails">Performance de Emails</TabsTrigger>
            <TabsTrigger value="events">Distribuição de Eventos</TabsTrigger>
            <TabsTrigger value="conversion">Taxa de Conversão</TabsTrigger>
            <TabsTrigger value="revenue">Receita Recuperada</TabsTrigger>
          </TabsList>

          <TabsContent value="emails" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Emails ao Longo do Tempo</CardTitle>
                <CardDescription>
                  Enviados, abertos e clicados nos últimos 7 dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={emailsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="enviados"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      name="Enviados"
                    />
                    <Line
                      type="monotone"
                      dataKey="abertos"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      name="Abertos"
                    />
                    <Line
                      type="monotone"
                      dataKey="clicados"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      name="Clicados"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Eventos por Tipo</CardTitle>
                <CardDescription>
                  Proporção de cada tipo de webhook recebido
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={eventsByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {eventsByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conversion" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Taxa de Conversão por Template</CardTitle>
                <CardDescription>
                  Performance de cada template de email
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={conversionByTemplate} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="template" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Bar dataKey="taxa" fill="#3B82F6" name="Taxa de Conversão (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Receita Recuperada por Mês</CardTitle>
                <CardDescription>
                  Valor total recuperado através das campanhas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={revenueRecovered}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                    <Bar dataKey="valor" fill="#10B981" name="Receita (R$)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 