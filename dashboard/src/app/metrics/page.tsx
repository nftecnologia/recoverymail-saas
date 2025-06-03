"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity,
  Target,
  Zap,
  Calendar,
  Download,
  RefreshCw,
  Mail,
  MousePointerClick,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  DollarSign,
  Percent
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format, subDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MetricCard {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: any;
  color: string;
}

interface ChartData {
  emailsOverTime: Array<{
    date: string;
    sent: number;
    opened: number;
    clicked: number;
  }>;
  eventsByType: Array<{
    name: string;
    value: number;
  }>;
  conversionByTemplate: Array<{
    template: string;
    total: number;
    clicked: number;
    conversion_rate: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const eventTypeLabels: Record<string, string> = {
  'ABANDONED_CART': 'Carrinho Abandonado',
  'BANK_SLIP_EXPIRED': 'Boleto Expirado',
  'BANK_SLIP_GENERATED': 'Boleto Gerado',
  'PIX_EXPIRED': 'PIX Expirado',
  'PIX_GENERATED': 'PIX Gerado',
  'SALE_APPROVED': 'Venda Aprovada',
  'SALE_REFUSED': 'Venda Recusada',
  'SALE_REFUNDED': 'Venda Reembolsada',
  'SALE_CHARGEBACK': 'Chargeback',
  'SUBSCRIPTION_CANCELED': 'Assinatura Cancelada',
  'SUBSCRIPTION_EXPIRED': 'Assinatura Expirada',
  'SUBSCRIPTION_RENEWED': 'Assinatura Renovada',
};

export default function MetricsPage() {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [chartResponse, metricsResponse] = await Promise.all([
        api.getChartData(period),
        api.getMetrics()
      ]);
      
      setChartData(chartResponse);
      setMetrics(metricsResponse);
    } catch (error) {
      toast.error('Erro ao carregar dados de analytics');
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd/MM', { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const metricCards: MetricCard[] = metrics ? [
    {
      title: "Total de Emails",
      value: metrics.totalEmails?.toLocaleString() || "0",
      change: 12.5,
      changeLabel: "vs período anterior",
      icon: Mail,
      color: "blue"
    },
    {
      title: "Taxa de Entrega",
      value: formatPercent((metrics.deliveryRate || 0) * 100),
      change: 2.3,
      changeLabel: "vs período anterior",
      icon: CheckCircle,
      color: "green"
    },
    {
      title: "Taxa de Abertura",
      value: formatPercent((metrics.openRate || 0) * 100),
      change: -1.2,
      changeLabel: "vs período anterior",
      icon: Eye,
      color: "yellow"
    },
    {
      title: "Taxa de Clique",
      value: formatPercent((metrics.clickRate || 0) * 100),
      change: 5.8,
      changeLabel: "vs período anterior",
      icon: MousePointerClick,
      color: "purple"
    }
  ] : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics Avançado</h1>
            <p className="text-muted-foreground">
              Análise detalhada do desempenho dos emails e conversões
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={period} onValueChange={(v) => setPeriod(v as '7d' | '30d')}>
              <TabsList>
                <TabsTrigger value="7d">7 dias</TabsTrigger>
                <TabsTrigger value="30d">30 dias</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={loadData} disabled={loading} variant="outline">
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Atualizar
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map((metric, index) => {
            const Icon = metric.icon;
            const isPositive = metric.change > 0;
            
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {metric.title}
                  </CardTitle>
                  <Icon className={cn("h-4 w-4", `text-${metric.color}-600`)} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                    )}
                    <span className={isPositive ? "text-green-600" : "text-red-600"}>
                      {isPositive ? "+" : ""}{metric.change}%
                    </span>
                    <span className="ml-1">{metric.changeLabel}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        <Tabs defaultValue="timeline" className="space-y-4">
          <TabsList>
            <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
            <TabsTrigger value="events">Eventos por Tipo</TabsTrigger>
            <TabsTrigger value="templates">Performance de Templates</TabsTrigger>
            <TabsTrigger value="funnel">Funil de Conversão</TabsTrigger>
          </TabsList>

          {/* Timeline Chart */}
          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Desempenho de Emails ao Longo do Tempo
                </CardTitle>
                <CardDescription>
                  Emails enviados, abertos e clicados nos últimos {period === '7d' ? '7 dias' : '30 dias'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData?.emailsOverTime || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => `Data: ${formatDate(value)}`}
                        formatter={(value, name) => [
                          value,
                          name === 'sent' ? 'Enviados' : 
                          name === 'opened' ? 'Abertos' : 'Clicados'
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="sent" fill="#8884d8" name="Enviados" />
                      <Line 
                        type="monotone" 
                        dataKey="opened" 
                        stroke="#82ca9d" 
                        name="Abertos"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="clicked" 
                        stroke="#ffc658" 
                        name="Clicados"
                        strokeWidth={2}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events by Type */}
          <TabsContent value="events" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Eventos por Tipo
                  </CardTitle>
                  <CardDescription>
                    Distribuição dos tipos de eventos processados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData?.eventsByType?.map(item => ({
                            ...item,
                            name: eventTypeLabels[item.name] || item.name
                          })) || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData?.eventsByType?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Volume de Eventos
                  </CardTitle>
                  <CardDescription>
                    Quantidade de eventos por tipo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={chartData?.eventsByType?.map(item => ({
                          ...item,
                          name: eventTypeLabels[item.name] || item.name
                        })) || []}
                        layout="horizontal"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={100}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Template Performance */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Performance de Templates
                </CardTitle>
                <CardDescription>
                  Taxa de conversão por template de email
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData?.conversionByTemplate || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="template" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'conversion_rate' ? `${value}%` : value,
                          name === 'total' ? 'Total Enviados' : 
                          name === 'clicked' ? 'Cliques' : 'Taxa de Conversão'
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="total" fill="#8884d8" name="Total Enviados" />
                      <Bar dataKey="clicked" fill="#82ca9d" name="Cliques" />
                      <Bar dataKey="conversion_rate" fill="#ffc658" name="Taxa de Conversão (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conversion Funnel */}
          <TabsContent value="funnel" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Funil de Conversão
                </CardTitle>
                <CardDescription>
                  Acompanhamento do funil de emails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Funnel Steps */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="bg-blue-100 text-blue-800 rounded-lg p-4">
                        <Mail className="h-8 w-8 mx-auto mb-2" />
                        <div className="text-2xl font-bold">{metrics?.totalEmails || 0}</div>
                        <div className="text-sm">Emails Enviados</div>
                        <div className="text-xs text-muted-foreground">100%</div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="bg-green-100 text-green-800 rounded-lg p-4">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                        <div className="text-2xl font-bold">
                          {Math.round((metrics?.deliveryRate || 0) * (metrics?.totalEmails || 0))}
                        </div>
                        <div className="text-sm">Entregues</div>
                        <div className="text-xs text-muted-foreground">
                          {formatPercent((metrics?.deliveryRate || 0) * 100)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="bg-yellow-100 text-yellow-800 rounded-lg p-4">
                        <Eye className="h-8 w-8 mx-auto mb-2" />
                        <div className="text-2xl font-bold">
                          {Math.round((metrics?.openRate || 0) * (metrics?.totalEmails || 0))}
                        </div>
                        <div className="text-sm">Abertos</div>
                        <div className="text-xs text-muted-foreground">
                          {formatPercent((metrics?.openRate || 0) * 100)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="bg-purple-100 text-purple-800 rounded-lg p-4">
                        <MousePointerClick className="h-8 w-8 mx-auto mb-2" />
                        <div className="text-2xl font-bold">
                          {Math.round((metrics?.clickRate || 0) * (metrics?.totalEmails || 0))}
                        </div>
                        <div className="text-sm">Clicados</div>
                        <div className="text-xs text-muted-foreground">
                          {formatPercent((metrics?.clickRate || 0) * 100)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Insights */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Melhor Dia</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">Sexta</div>
                        <div className="text-xs text-muted-foreground">
                          +15% aberturas vs média
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Melhor Horário</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">14:00</div>
                        <div className="text-xs text-muted-foreground">
                          +23% cliques vs média
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Template Top</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">Urgência</div>
                        <div className="text-xs text-muted-foreground">
                          8.5% taxa de clique
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando dados...</span>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}