"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  Settings, 
  Key, 
  Mail, 
  Webhook, 
  Clock,
  Save,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  Building,
  Zap,
  AlertCircle,
  CheckCircle,
  Info,
  Sparkles,
  Globe,
  User,
  Calendar,
  BarChart3,
  Lock,
  Unlock,
  ArrowRight,
  Timer,
  MousePointerClick,
  FileText,
  ShoppingCart,
  XCircle
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

export default function SettingsPage() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  // Dados mockados
  const organization = {
    id: "test-org-123",
    name: "Recovery Mail Demo",
    domain: "recoverymail.com",
    apiKey: "rm_live_sk_1234567890abcdef",
    webhookSecret: "whsec_abcdef1234567890",
    webhookUrl: "https://api.recoverymail.com/webhook/test-org-123",
    createdAt: "2025-05-01T00:00:00.000Z",
    plan: "Pro",
    status: "active"
  };

  const [emailSettings, setEmailSettings] = useState({
    fromName: "Recovery Mail",
    fromEmail: "noreply@recoverymail.com",
    replyTo: "suporte@recoverymail.com",
    dailyLimit: 1000,
    usedToday: 26,
    trackOpens: true,
    trackClicks: true,
    customDomain: false,
    domainVerified: false
  });

  const [delays, setDelays] = useState({
    ABANDONED_CART: [2, 24, 72], // em horas
    PIX_EXPIRED: [0.25, 2], // em horas
    BANK_SLIP_EXPIRED: [24, 72, 168], // em horas
    SALE_REFUSED: [0.5, 6],
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência`,
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast({
      title: "Configurações salvas",
      description: "Suas alterações foram aplicadas com sucesso",
    });
  };

  const formatDelay = (hours: number) => {
    if (hours < 1) {
      return `${hours * 60} minutos`;
    } else if (hours === 24) {
      return "1 dia";
    } else if (hours > 24) {
      return `${hours / 24} dias`;
    }
    return `${hours} horas`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header com gradiente */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 text-white">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                <Settings className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Configurações</h1>
                <p className="mt-1 text-lg text-white/80">
                  Gerencie todas as configurações da sua organização
                </p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <Shield className="absolute right-8 top-8 h-8 w-8 text-white/20" />
        </div>

        {/* Status Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg transition-all hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Status</CardTitle>
                <div className="rounded-lg bg-green-500/10 p-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-gray-900">Ativo</span>
                <p className="mt-1 text-sm text-gray-500">Sistema operacional</p>
              </div>
            </CardHeader>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg transition-all hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Plano</CardTitle>
                <div className="rounded-lg bg-purple-500/10 p-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-gray-900">{organization.plan}</span>
                <p className="mt-1 text-sm text-gray-500">Plano atual</p>
              </div>
            </CardHeader>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg transition-all hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">API Calls</CardTitle>
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-gray-900">2.3k</span>
                <p className="mt-1 text-sm text-gray-500">Este mês</p>
              </div>
            </CardHeader>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-orange-50 to-red-50 shadow-lg transition-all hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Segurança</CardTitle>
                <div className="rounded-lg bg-orange-500/10 p-2">
                  <Shield className="h-4 w-4 text-orange-600" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-gray-900">100%</span>
                <p className="mt-1 text-sm text-gray-500">Conformidade</p>
              </div>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100/50">
            <TabsTrigger value="general" className="gap-2">
              <Building className="h-4 w-4" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Key className="h-4 w-4" />
              API & Webhooks
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="delays" className="gap-2">
              <Clock className="h-4 w-4" />
              Delays
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b bg-gray-50/50">
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Informações da Organização
                </CardTitle>
                <CardDescription>
                  Detalhes básicos da sua conta e organização
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Nome da Organização</Label>
                    <Input
                      id="org-name"
                      defaultValue={organization.name}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="domain">Domínio</Label>
                    <div className="flex gap-2">
                      <Input
                        id="domain"
                        defaultValue={organization.domain}
                        className="bg-white"
                      />
                      <Button variant="outline" size="icon">
                        <Globe className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-id">ID da Organização</Label>
                    <div className="flex gap-2">
                      <Input
                        id="org-id"
                        value={organization.id}
                        className="bg-gray-50 font-mono text-sm"
                        readOnly
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => copyToClipboard(organization.id, "ID da organização")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Criado em</Label>
                    <div className="flex items-center gap-2 rounded-md border bg-gray-50 px-3 py-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {new Date(organization.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white p-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">Plano Pro</p>
                        <p className="text-sm text-gray-600">Acesso completo a todos os recursos</p>
                      </div>
                    </div>
                    <Button variant="outline" className="gap-2">
                      Gerenciar Plano
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Salvar Alterações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Settings */}
          <TabsContent value="api" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b bg-gray-50/50">
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Chave de API
                </CardTitle>
                <CardDescription>
                  Use esta chave para autenticar suas requisições à API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="rounded-lg bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-900">Mantenha sua chave segura</p>
                      <p className="text-amber-700">
                        Nunca exponha sua chave de API em código client-side ou repositórios públicos
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Chave de API</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        value={organization.apiKey}
                        className="bg-gray-50 pr-10 font-mono text-sm"
                        readOnly
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(organization.apiKey, "Chave de API")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-gray-100 p-2">
                      <Lock className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Última regeneração</p>
                      <p className="text-sm text-gray-500">Nunca regenerada</p>
                    </div>
                  </div>
                  <Button variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Regenerar Chave
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b bg-gray-50/50">
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Webhook
                </CardTitle>
                <CardDescription>
                  Configure o endpoint para receber eventos do seu e-commerce
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="space-y-2">
                  <Label>URL do Webhook</Label>
                  <div className="flex gap-2">
                    <Input
                      value={organization.webhookUrl}
                      className="bg-gray-50 font-mono text-sm"
                      readOnly
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(organization.webhookUrl, "URL do webhook")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Envie seus webhooks para este endpoint
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Webhook Secret</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showWebhookSecret ? "text" : "password"}
                        value={organization.webhookSecret}
                        className="bg-gray-50 pr-10 font-mono text-sm"
                        readOnly
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                      >
                        {showWebhookSecret ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(organization.webhookSecret, "Webhook secret")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Use este secret para validar a assinatura dos webhooks
                  </p>
                </div>

                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-600" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">Teste seu webhook</p>
                      <p className="text-blue-700">
                        Use nosso simulador para testar a integração antes de ir para produção
                      </p>
                      <Button variant="link" className="h-auto p-0 text-blue-600">
                        Abrir simulador →
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Configurações de Email
                    </CardTitle>
                    <CardDescription>
                      Configure o remetente e preferências de envio
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => window.location.href = '/settings/email'}
                  >
                    <Globe className="h-4 w-4" />
                    Configurar Domínio
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="from-name">Nome do Remetente</Label>
                    <Input
                      id="from-name"
                      value={emailSettings.fromName}
                      onChange={(e) => setEmailSettings({...emailSettings, fromName: e.target.value})}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="from-email">Email do Remetente</Label>
                    <Input
                      id="from-email"
                      type="email"
                      value={emailSettings.fromEmail}
                      onChange={(e) => setEmailSettings({...emailSettings, fromEmail: e.target.value})}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reply-to">Email de Resposta</Label>
                    <Input
                      id="reply-to"
                      type="email"
                      value={emailSettings.replyTo}
                      onChange={(e) => setEmailSettings({...emailSettings, replyTo: e.target.value})}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="daily-limit">Limite Diário</Label>
                    <Input
                      id="daily-limit"
                      type="number"
                      value={emailSettings.dailyLimit}
                      onChange={(e) => setEmailSettings({...emailSettings, dailyLimit: parseInt(e.target.value)})}
                      className="bg-white"
                    />
                  </div>
                </div>

                {/* Usage Stats */}
                <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Uso Hoje</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {emailSettings.usedToday} / {emailSettings.dailyLimit}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {((emailSettings.usedToday / emailSettings.dailyLimit) * 100).toFixed(1)}% do limite diário
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="mb-2 text-sm font-medium text-gray-600">Disponível</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {emailSettings.dailyLimit - emailSettings.usedToday}
                      </div>
                      <div className="mt-2 h-2 w-32 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                          style={{ width: `${(emailSettings.usedToday / emailSettings.dailyLimit) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tracking Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Rastreamento</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center gap-3">
                        <Eye className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">Rastrear Aberturas</p>
                          <p className="text-sm text-gray-500">Monitore quando os emails são abertos</p>
                        </div>
                      </div>
                      <Switch
                        checked={emailSettings.trackOpens}
                        onCheckedChange={(checked) => setEmailSettings({...emailSettings, trackOpens: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center gap-3">
                        <MousePointerClick className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">Rastrear Cliques</p>
                          <p className="text-sm text-gray-500">Monitore cliques nos links dos emails</p>
                        </div>
                      </div>
                      <Switch
                        checked={emailSettings.trackClicks}
                        onCheckedChange={(checked) => setEmailSettings({...emailSettings, trackClicks: checked})}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delay Settings */}
          <TabsContent value="delays" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b bg-gray-50/50">
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Configuração de Delays
                </CardTitle>
                <CardDescription>
                  Defina os tempos de espera ideais para cada tipo de evento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-600" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">Delays otimizados por IA</p>
                      <p className="text-blue-700">
                        Os tempos são ajustados automaticamente com base na performance das campanhas
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {Object.entries(delays).map(([eventType, attemptDelays]) => {
                    const eventConfig = {
                      ABANDONED_CART: { 
                        label: "Carrinho Abandonado", 
                        icon: ShoppingCart,
                        color: "from-orange-500 to-red-500",
                        bgColor: "from-orange-50 to-red-50"
                      },
                      PIX_EXPIRED: { 
                        label: "PIX Expirado", 
                        icon: Zap,
                        color: "from-purple-500 to-pink-500",
                        bgColor: "from-purple-50 to-pink-50"
                      },
                      BANK_SLIP_EXPIRED: { 
                        label: "Boleto Expirado", 
                        icon: FileText,
                        color: "from-yellow-500 to-orange-500",
                        bgColor: "from-yellow-50 to-orange-50"
                      },
                      SALE_REFUSED: { 
                        label: "Venda Recusada", 
                        icon: XCircle,
                        color: "from-red-500 to-pink-500",
                        bgColor: "from-red-50 to-pink-50"
                      },
                    }[eventType];

                    const Icon = eventConfig?.icon || Clock;

                    return (
                      <div key={eventType} className="rounded-lg border p-6">
                        <div className="mb-4 flex items-center gap-3">
                          <div className={cn(
                            "rounded-lg p-2",
                            `bg-gradient-to-br ${eventConfig?.bgColor}`
                          )}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <h3 className="font-medium">{eventConfig?.label}</h3>
                        </div>
                        
                        <div className="space-y-4">
                          {attemptDelays.map((delay, index) => (
                            <div key={index} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm">
                                  {index + 1}ª Tentativa
                                </Label>
                                <span className="text-sm font-medium text-gray-900">
                                  {formatDelay(delay)}
                                </span>
                              </div>
                              <Slider
                                value={[delay]}
                                onValueChange={(value) => {
                                  const newDelays = [...attemptDelays];
                                  newDelays[index] = value[0];
                                  setDelays({
                                    ...delays,
                                    [eventType]: newDelays
                                  });
                                }}
                                max={eventType === 'PIX_EXPIRED' ? 4 : 168}
                                min={eventType === 'PIX_EXPIRED' ? 0.25 : 1}
                                step={eventType === 'PIX_EXPIRED' ? 0.25 : 1}
                                className="w-full"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Salvar Delays
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 