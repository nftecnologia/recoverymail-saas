"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  Eye,
  Info,
  Clock,
  Zap,
  Target
} from "lucide-react";
import { useState } from "react";

const eventTypes = [
  { 
    value: "ABANDONED_CART", 
    label: "Carrinho Abandonado", 
    attempts: 3,
    description: "Recupera vendas de carrinhos abandonados com sequência otimizada"
  },
  { 
    value: "PIX_EXPIRED", 
    label: "PIX Expirado", 
    attempts: 2,
    description: "Ação rápida para PIX que expira em minutos"
  },
  { 
    value: "BANK_SLIP_EXPIRED", 
    label: "Boleto Expirado", 
    attempts: 3,
    description: "Sequência espaçada para boletos com prazo maior"
  },
  { 
    value: "SALE_REFUSED", 
    label: "Venda Recusada", 
    attempts: 2,
    description: "Oferece alternativas de pagamento rapidamente"
  },
  { 
    value: "SALE_APPROVED", 
    label: "Venda Aprovada", 
    attempts: 1,
    description: "Confirmação e boas-vindas ao cliente"
  },
];

const templateStrategies = {
  ABANDONED_CART: [
    { delay: "2 horas", strategy: "Lembrete gentil", emoji: "👋" },
    { delay: "24 horas", strategy: "Criar urgência", emoji: "⏰" },
    { delay: "72 horas", strategy: "Oferta especial", emoji: "🎁" }
  ],
  PIX_EXPIRED: [
    { delay: "15 minutos", strategy: "Urgência máxima", emoji: "🚨" },
    { delay: "2 horas", strategy: "Última chance", emoji: "⚡" }
  ],
  BANK_SLIP_EXPIRED: [
    { delay: "1 dia", strategy: "Lembrete amigável", emoji: "📋" },
    { delay: "3 dias", strategy: "Facilitar pagamento", emoji: "💳" },
    { delay: "7 dias", strategy: "Oferta irrecusável", emoji: "🎯" }
  ],
  SALE_REFUSED: [
    { delay: "30 minutos", strategy: "Alternativas rápidas", emoji: "🔄" },
    { delay: "6 horas", strategy: "Suporte personalizado", emoji: "🤝" }
  ],
  SALE_APPROVED: [
    { delay: "Imediato", strategy: "Confirmação e próximos passos", emoji: "✅" }
  ]
};

export default function TemplatesPage() {
  const [selectedEvent, setSelectedEvent] = useState("ABANDONED_CART");
  
  const currentEvent = eventTypes.find(e => e.value === selectedEvent);
  const strategies = templateStrategies[selectedEvent as keyof typeof templateStrategies] || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Templates Automáticos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Templates otimizados para máxima conversão em cada situação
          </p>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <Info className="h-5 w-5 mr-2" />
              Como funcionam os templates
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800">
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Templates criados por especialistas em copywriting e conversão</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Personalizados automaticamente com dados do cliente e produto</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Timing otimizado baseado em dados de milhares de campanhas</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>A/B testing contínuo para melhorar conversões</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Event Type Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Tipos de Evento</CardTitle>
            <CardDescription>
              Selecione um tipo de evento para ver a estratégia de recuperação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedEvent} onValueChange={setSelectedEvent}>
              <TabsList className="grid grid-cols-2 lg:grid-cols-5 h-auto">
                {eventTypes.map((event) => (
                  <TabsTrigger
                    key={event.value}
                    value={event.value}
                    className="flex flex-col py-3"
                  >
                    <span className="font-medium">{event.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {event.attempts} {event.attempts === 1 ? 'email' : 'emails'}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {eventTypes.map((event) => (
                <TabsContent key={event.value} value={event.value} className="mt-6">
                  <div className="space-y-6">
                    {/* Event Description */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">{event.description}</p>
                    </div>

                    {/* Email Sequence */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Sequência de Emails</h3>
                      <div className="space-y-4">
                        {strategies.map((strategy, index) => (
                          <Card key={index}>
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center mb-2">
                                    <span className="text-2xl mr-3">{strategy.emoji}</span>
                                    <div>
                                      <h4 className="font-medium">
                                        {index + 1}ª Tentativa - {strategy.strategy}
                                      </h4>
                                      <div className="flex items-center mt-1 text-sm text-gray-500">
                                        <Clock className="h-3 w-3 mr-1" />
                                        <span>Enviado após {strategy.delay}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Preview do conteúdo */}
                                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm font-medium mb-2">Exemplo de conteúdo:</p>
                                    {event.value === "ABANDONED_CART" && index === 0 && (
                                      <div className="text-sm text-gray-600">
                                        <p className="mb-2">Assunto: 🛒 Oi João, você esqueceu alguns itens!</p>
                                        <p>Notamos que você deixou o "Curso de Marketing Digital" no carrinho. 
                                        Que tal finalizar sua compra? Seu carrinho está guardado e pronto!</p>
                                      </div>
                                    )}
                                    {event.value === "ABANDONED_CART" && index === 1 && (
                                      <div className="text-sm text-gray-600">
                                        <p className="mb-2">Assunto: ⏰ João, seus itens podem acabar!</p>
                                        <p>O "Curso de Marketing Digital" está com alta procura. 
                                        Garantimos seu carrinho por mais 24h, mas não podemos segurar por muito tempo!</p>
                                      </div>
                                    )}
                                    {event.value === "ABANDONED_CART" && index === 2 && (
                                      <div className="text-sm text-gray-600">
                                        <p className="mb-2">Assunto: 🎁 10% OFF exclusivo para você, João!</p>
                                        <p>Última chance! Use o cupom VOLTA10 e ganhe 10% de desconto 
                                        no "Curso de Marketing Digital". Oferta válida por 48h!</p>
                                      </div>
                                    )}
                                    {event.value === "PIX_EXPIRED" && index === 0 && (
                                      <div className="text-sm text-gray-600">
                                        <p className="mb-2">Assunto: 🚨 Seu PIX expira em 15 minutos!</p>
                                        <p>João, o PIX do seu pedido expira em breve! 
                                        Clique aqui para copiar o código e finalizar agora mesmo.</p>
                                      </div>
                                    )}
                                    {event.value === "BANK_SLIP_EXPIRED" && index === 0 && (
                                      <div className="text-sm text-gray-600">
                                        <p className="mb-2">Assunto: 📋 Seu boleto venceu ontem</p>
                                        <p>Oi João! Seu boleto venceu, mas não se preocupe. 
                                        Geramos um novo boleto com a mesma facilidade de pagamento!</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Performance Stats */}
                    <Card className="bg-green-50 border-green-200">
                      <CardHeader>
                        <CardTitle className="flex items-center text-green-900">
                          <Target className="h-5 w-5 mr-2" />
                          Performance Média
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-green-900">32%</p>
                            <p className="text-sm text-green-700">Taxa de Recuperação</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-green-900">68%</p>
                            <p className="text-sm text-green-700">Taxa de Abertura</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-green-900">24%</p>
                            <p className="text-sm text-green-700">Taxa de Clique</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Variables Info */}
        <Card>
          <CardHeader>
            <CardTitle>Personalização Automática</CardTitle>
            <CardDescription>
              Variáveis preenchidas automaticamente em cada email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Dados do Cliente</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Nome completo e primeiro nome</li>
                  <li>• Email e telefone</li>
                  <li>• Histórico de compras</li>
                  <li>• Localização</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Dados do Pedido</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Produtos no carrinho</li>
                  <li>• Valor total e descontos</li>
                  <li>• Link de recuperação</li>
                  <li>• Prazo de validade</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 