"use client";

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
  AreaChart
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
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

// Dados mockados para os gráficos
const conversionData = [
  { name: "Seg", taxa: 42 },
  { name: "Ter", taxa: 38 },
  { name: "Qua", taxa: 45 },
  { name: "Qui", taxa: 51 },
  { name: "Sex", taxa: 48 },
  { name: "Sáb", taxa: 55 },
  { name: "Dom", taxa: 52 },
];

const emailPerformance = [
  { name: "00h", enviados: 120, abertos: 89, clicados: 34 },
  { name: "06h", enviados: 280, abertos: 210, clicados: 98 },
  { name: "12h", enviados: 450, abertos: 380, clicados: 156 },
  { name: "18h", enviados: 380, abertos: 290, clicados: 134 },
];

const eventDistribution = [
  { name: "Carrinho Abandonado", value: 45, color: "#f97316" },
  { name: "PIX Expirado", value: 20, color: "#a855f7" },
  { name: "Boleto Expirado", value: 15, color: "#eab308" },
  { name: "Venda Recusada", value: 10, color: "#ef4444" },
  { name: "Outros", value: 10, color: "#6b7280" },
];

const monthlyTrend = [
  { month: "Jan", recuperado: 45000, potencial: 120000 },
  { month: "Fev", recuperado: 52000, potencial: 130000 },
  { month: "Mar", recuperado: 48000, potencial: 125000 },
  { month: "Abr", recuperado: 61000, potencial: 140000 },
  { month: "Mai", recuperado: 58000, potencial: 135000 },
  { month: "Jun", recuperado: 67000, potencial: 150000 },
];

export default function MetricsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header com gradiente */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-8 text-white">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Central de Métricas</h1>
                <p className="mt-1 text-lg text-white/80">
                  Análise detalhada do desempenho das suas campanhas
                </p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <Activity className="absolute right-8 top-8 h-8 w-8 text-white/20" />
        </div>

        {/* Cards de KPIs */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg transition-all hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Valor Recuperado</CardTitle>
                <div className="rounded-lg bg-green-500/10 p-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">R$ 67.5k</span>
                  <Badge className="bg-green-100 text-green-700">
                    +23%
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-gray-500">Este mês</p>
              </div>
            </CardHeader>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg transition-all hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Taxa de Conversão</CardTitle>
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">48.3%</span>
                  <Badge className="bg-blue-100 text-blue-700">
                    +5.2%
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-gray-500">Média semanal</p>
              </div>
            </CardHeader>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg transition-all hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Tempo Médio</CardTitle>
                <div className="rounded-lg bg-purple-500/10 p-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">2.4h</span>
                  <Badge className="bg-purple-100 text-purple-700">
                    -18min
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-gray-500">Para conversão</p>
              </div>
            </CardHeader>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-orange-50 to-red-50 shadow-lg transition-all hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">ROI</CardTitle>
                <div className="rounded-lg bg-orange-500/10 p-2">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">12.5x</span>
                  <Badge className="bg-orange-100 text-orange-700">
                    +2.3x
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-gray-500">Retorno sobre investimento</p>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Gráficos em Tabs */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Análise Detalhada</CardTitle>
                <CardDescription>Visualize o desempenho em diferentes perspectivas</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Últimos 7 dias
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="conversion" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100/50">
                <TabsTrigger value="conversion">Taxa de Conversão</TabsTrigger>
                <TabsTrigger value="performance">Performance de Email</TabsTrigger>
                <TabsTrigger value="distribution">Distribuição</TabsTrigger>
                <TabsTrigger value="trend">Tendência Mensal</TabsTrigger>
              </TabsList>

              <TabsContent value="conversion" className="space-y-4">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={conversionData}>
                      <defs>
                        <linearGradient id="colorConversion" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="name" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="taxa" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorConversion)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-sm text-gray-600">Média</p>
                    <p className="text-2xl font-bold text-gray-900">47.3%</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-sm text-gray-600">Melhor dia</p>
                    <p className="text-2xl font-bold text-gray-900">Sábado (55%)</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-sm text-gray-600">Tendência</p>
                    <p className="text-2xl font-bold text-green-600">↑ 8.5%</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={emailPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="name" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }} 
                      />
                      <Legend />
                      <Bar dataKey="enviados" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="abertos" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="clicados" fill="#ec4899" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="text-sm text-gray-600">Taxa de Abertura</p>
                    <p className="text-2xl font-bold text-blue-600">78.4%</p>
                  </div>
                  <div className="rounded-lg bg-purple-50 p-4">
                    <p className="text-sm text-gray-600">Taxa de Clique</p>
                    <p className="text-2xl font-bold text-purple-600">36.2%</p>
                  </div>
                  <div className="rounded-lg bg-pink-50 p-4">
                    <p className="text-sm text-gray-600">Melhor Horário</p>
                    <p className="text-2xl font-bold text-pink-600">12h</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="distribution" className="space-y-4">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={eventDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {eventDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {eventDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                      <div 
                        className="h-4 w-4 rounded"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.value}% dos eventos</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="trend" className="space-y-4">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                        formatter={(value: number) => `R$ ${(value / 1000).toFixed(1)}k`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="recuperado" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ fill: '#10b981', r: 6 }}
                        activeDot={{ r: 8 }}
                        name="Valor Recuperado"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="potencial" 
                        stroke="#6366f1" 
                        strokeWidth={3}
                        strokeDasharray="5 5"
                        dot={{ fill: '#6366f1', r: 6 }}
                        activeDot={{ r: 8 }}
                        name="Potencial Total"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-green-50 p-4">
                    <p className="text-sm text-gray-600">Total Recuperado</p>
                    <p className="text-2xl font-bold text-green-600">R$ 336k</p>
                  </div>
                  <div className="rounded-lg bg-indigo-50 p-4">
                    <p className="text-sm text-gray-600">Potencial Total</p>
                    <p className="text-2xl font-bold text-indigo-600">R$ 800k</p>
                  </div>
                  <div className="rounded-lg bg-purple-50 p-4">
                    <p className="text-sm text-gray-600">Taxa de Captura</p>
                    <p className="text-2xl font-bold text-purple-600">42%</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 