"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  RefreshCw
} from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  
  // Dados mockados
  const organization = {
    id: "test-org-123",
    name: "Recovery Mail Demo",
    domain: "recoverymail.com",
    apiKey: "rm_live_sk_1234567890abcdef",
    webhookSecret: "whsec_abcdef1234567890",
    webhookUrl: "https://api.recoverymail.com/webhook/test-org-123",
    createdAt: "2025-05-01T00:00:00.000Z",
  };

  const emailSettings = {
    fromName: "Recovery Mail",
    fromEmail: "noreply@recoverymail.com",
    replyTo: "suporte@recoverymail.com",
    dailyLimit: 1000,
    usedToday: 26,
  };

  const delays = [
    { event: "ABANDONED_CART", attempts: [
      { number: 1, delay: "2 horas", template: "abandoned-cart-reminder" },
      { number: 2, delay: "24 horas", template: "abandoned-cart-urgency" },
      { number: 3, delay: "72 horas", template: "abandoned-cart-discount" },
    ]},
    { event: "PIX_EXPIRED", attempts: [
      { number: 1, delay: "15 minutos", template: "pix-expired-urgent" },
      { number: 2, delay: "2 horas", template: "pix-expired-new" },
    ]},
    { event: "BANK_SLIP_EXPIRED", attempts: [
      { number: 1, delay: "1 dia", template: "bank-slip-expired-reminder" },
      { number: 2, delay: "3 dias", template: "bank-slip-expired-new" },
      { number: 3, delay: "7 dias", template: "bank-slip-expired-discount" },
    ]},
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Aqui você poderia adicionar um toast de confirmação
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Configurações
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie as configurações da sua organização
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="api">API & Webhooks</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="delays">Delays</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Organização</CardTitle>
                <CardDescription>
                  Detalhes básicos da sua conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Nome da Organização</label>
                    <input
                      type="text"
                      value={organization.name}
                      className="mt-1 w-full px-3 py-2 border rounded-md"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Domínio</label>
                    <input
                      type="text"
                      value={organization.domain}
                      className="mt-1 w-full px-3 py-2 border rounded-md"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">ID da Organização</label>
                    <input
                      type="text"
                      value={organization.id}
                      className="mt-1 w-full px-3 py-2 border rounded-md bg-gray-50"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Criado em</label>
                    <input
                      type="text"
                      value={new Date(organization.createdAt).toLocaleDateString('pt-BR')}
                      className="mt-1 w-full px-3 py-2 border rounded-md bg-gray-50"
                      readOnly
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Settings */}
          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Chave de API</CardTitle>
                <CardDescription>
                  Use esta chave para autenticar suas requisições
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={organization.apiKey}
                    className="flex-1 px-3 py-2 border rounded-md font-mono text-sm"
                    readOnly
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(organization.apiKey)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Última regeneração: Nunca
                  </p>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerar Chave
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Webhook</CardTitle>
                <CardDescription>
                  Configure o endpoint para receber webhooks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">URL do Webhook</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <input
                      type="text"
                      value={organization.webhookUrl}
                      className="flex-1 px-3 py-2 border rounded-md font-mono text-sm"
                      readOnly
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(organization.webhookUrl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Webhook Secret</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <input
                      type={showWebhookSecret ? "text" : "password"}
                      value={organization.webhookSecret}
                      className="flex-1 px-3 py-2 border rounded-md font-mono text-sm"
                      readOnly
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                    >
                      {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(organization.webhookSecret)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Email</CardTitle>
                <CardDescription>
                  Configure o remetente e limites de envio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Nome do Remetente</label>
                    <input
                      type="text"
                      value={emailSettings.fromName}
                      className="mt-1 w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email do Remetente</label>
                    <input
                      type="email"
                      value={emailSettings.fromEmail}
                      className="mt-1 w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email de Resposta</label>
                    <input
                      type="email"
                      value={emailSettings.replyTo}
                      className="mt-1 w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Limite Diário</label>
                    <input
                      type="number"
                      value={emailSettings.dailyLimit}
                      className="mt-1 w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Uso Hoje</p>
                      <p className="text-2xl font-bold">
                        {emailSettings.usedToday} / {emailSettings.dailyLimit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {((emailSettings.usedToday / emailSettings.dailyLimit) * 100).toFixed(1)}% usado
                      </p>
                      <div className="mt-2 w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(emailSettings.usedToday / emailSettings.dailyLimit) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delay Settings */}
          <TabsContent value="delays" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuração de Delays</CardTitle>
                <CardDescription>
                  Defina os tempos de espera para cada tipo de evento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {delays.map((eventConfig) => (
                    <div key={eventConfig.event} className="border rounded-lg p-4">
                      <h3 className="font-medium mb-3 flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        {eventConfig.event.replace(/_/g, ' ')}
                      </h3>
                      <div className="space-y-2">
                        {eventConfig.attempts.map((attempt) => (
                          <div key={attempt.number} className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <Badge variant="outline">
                                Tentativa {attempt.number}
                              </Badge>
                              <span className="text-sm">
                                Aguardar <strong>{attempt.delay}</strong>
                              </span>
                            </div>
                            <Badge variant="secondary">
                              {attempt.template}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
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