"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Mail, 
  Eye,
  Info,
  Clock,
  Zap,
  Target,
  Sparkles,
  ShoppingCart,
  CreditCard,
  FileText,
  XCircle,
  CheckCircle,
  RefreshCw,
  DollarSign,
  Users,
  TrendingUp,
  Smartphone,
  Monitor,
  ArrowRight,
  MousePointerClick
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const eventTypes = [
  { 
    value: "ABANDONED_CART", 
    label: "Carrinho Abandonado",
    icon: ShoppingCart,
    color: "from-orange-500 to-red-500",
    bgColor: "from-orange-50 to-red-50",
    attempts: 3,
    description: "Recupera vendas de carrinhos abandonados com sequência otimizada"
  },
  { 
    value: "PIX_EXPIRED", 
    label: "PIX Expirado",
    icon: Zap,
    color: "from-purple-500 to-pink-500",
    bgColor: "from-purple-50 to-pink-50",
    attempts: 2,
    description: "Ação rápida para PIX que expira em minutos"
  },
  { 
    value: "BANK_SLIP_EXPIRED", 
    label: "Boleto Expirado",
    icon: FileText,
    color: "from-yellow-500 to-orange-500",
    bgColor: "from-yellow-50 to-orange-50",
    attempts: 3,
    description: "Sequência espaçada para boletos com prazo maior"
  },
  { 
    value: "SALE_REFUSED", 
    label: "Venda Recusada",
    icon: XCircle,
    color: "from-red-500 to-pink-500",
    bgColor: "from-red-50 to-pink-50",
    attempts: 2,
    description: "Oferece alternativas de pagamento rapidamente"
  },
  { 
    value: "SALE_APPROVED", 
    label: "Venda Aprovada",
    icon: CheckCircle,
    color: "from-green-500 to-emerald-500",
    bgColor: "from-green-50 to-emerald-50",
    attempts: 1,
    description: "Confirmação e boas-vindas ao cliente"
  },
];

const templateStrategies = {
  ABANDONED_CART: [
    { 
      delay: "2 horas", 
      strategy: "Lembrete gentil", 
      emoji: "👋",
      subject: "🛒 Oi {nome}, você esqueceu alguns itens!",
      preview: "Seus produtos estão esperando por você...",
      stats: { open: 45, click: 18, conversion: 8 }
    },
    { 
      delay: "24 horas", 
      strategy: "Criar urgência", 
      emoji: "⏰",
      subject: "⏰ {nome}, seus itens podem acabar!",
      preview: "Últimas unidades disponíveis do seu curso...",
      stats: { open: 52, click: 24, conversion: 12 }
    },
    { 
      delay: "72 horas", 
      strategy: "Oferta especial", 
      emoji: "🎁",
      subject: "🎁 10% OFF exclusivo para você, {nome}!",
      preview: "Última chance com desconto especial...",
      stats: { open: 58, click: 32, conversion: 18 }
    }
  ],
  PIX_EXPIRED: [
    { 
      delay: "15 minutos", 
      strategy: "Urgência máxima", 
      emoji: "🚨",
      subject: "🚨 Seu PIX expira em 15 minutos!",
      preview: "Copie o código agora e finalize sua compra...",
      stats: { open: 78, click: 45, conversion: 35 }
    },
    { 
      delay: "2 horas", 
      strategy: "Última chance", 
      emoji: "⚡",
      subject: "⚡ Novo PIX gerado para você!",
      preview: "Geramos um novo código PIX válido por 24h...",
      stats: { open: 65, click: 38, conversion: 25 }
    }
  ],
  BANK_SLIP_EXPIRED: [
    { 
      delay: "1 dia", 
      strategy: "Lembrete amigável", 
      emoji: "📋",
      subject: "📋 Seu boleto venceu ontem",
      preview: "Mas não se preocupe, já geramos um novo...",
      stats: { open: 42, click: 20, conversion: 10 }
    },
    { 
      delay: "3 dias", 
      strategy: "Facilitar pagamento", 
      emoji: "💳",
      subject: "💳 Que tal pagar com PIX ou cartão?",
      preview: "Aprovação instantânea e acesso imediato...",
      stats: { open: 48, click: 28, conversion: 15 }
    },
    { 
      delay: "7 dias", 
      strategy: "Oferta irrecusável", 
      emoji: "🎯",
      subject: "🎯 Última chance: 15% OFF no PIX!",
      preview: "Oferta especial válida por 48 horas...",
      stats: { open: 55, click: 35, conversion: 22 }
    }
  ],
  SALE_REFUSED: [
    { 
      delay: "30 minutos", 
      strategy: "Alternativas rápidas", 
      emoji: "🔄",
      subject: "🔄 Ops! Tivemos um problema com seu pagamento",
      preview: "Mas temos outras formas de pagamento...",
      stats: { open: 68, click: 40, conversion: 28 }
    },
    { 
      delay: "6 horas", 
      strategy: "Suporte personalizado", 
      emoji: "🤝",
      subject: "🤝 {nome}, podemos ajudar com seu pagamento?",
      preview: "Nossa equipe está pronta para auxiliar...",
      stats: { open: 55, click: 30, conversion: 18 }
    }
  ],
  SALE_APPROVED: [
    { 
      delay: "Imediato", 
      strategy: "Confirmação e próximos passos", 
      emoji: "✅",
      subject: "✅ Parabéns {nome}! Pagamento aprovado",
      preview: "Seu acesso já está liberado! Veja como começar...",
      stats: { open: 85, click: 60, conversion: 0 }
    }
  ]
};

// Mock de preview de email
const EmailPreview = ({ template, eventType }: { template: any, eventType: string }) => {
  return (
    <div className="relative overflow-hidden rounded-lg border bg-white shadow-sm">
      {/* Email Header */}
      <div className="border-b bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600" />
            <div>
              <p className="text-sm font-medium">Recovery Mail</p>
              <p className="text-xs text-gray-500">noreply@recoverymail.com</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            <Eye className="mr-1 h-3 w-3" />
            Preview
          </Badge>
        </div>
      </div>

      {/* Email Content */}
      <div className="p-6">
        <h3 className="mb-2 text-lg font-semibold">{template.subject.replace('{nome}', 'João')}</h3>
        <p className="mb-4 text-sm text-gray-600">{template.preview}</p>
        
        {/* Mock content based on event type */}
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-gray-700">
            Olá João,
          </p>
          
          {eventType === "ABANDONED_CART" && (
            <>
              <p className="text-sm leading-relaxed text-gray-700">
                Notamos que você deixou alguns itens incríveis no seu carrinho. 
                Que tal finalizar sua compra e começar sua jornada de aprendizado hoje mesmo?
              </p>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="mb-2 text-sm font-medium">Seus itens:</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Curso de Marketing Digital Avançado</span>
                  <span className="text-sm font-medium">R$ 497,00</span>
                </div>
              </div>
            </>
          )}

          <div className="pt-4">
            <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700">
              Finalizar Compra
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Email Footer */}
      <div className="border-t bg-gray-50 p-4 text-center text-xs text-gray-500">
        <p>© 2024 Recovery Mail. Todos os direitos reservados.</p>
        <p className="mt-1">
          <a href="#" className="text-indigo-600 hover:underline">Descadastrar</a> · 
          <a href="#" className="ml-1 text-indigo-600 hover:underline">Preferências</a>
        </p>
      </div>
    </div>
  );
};

export default function TemplatesPage() {
  const [selectedEvent, setSelectedEvent] = useState("ABANDONED_CART");
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  
  const currentEvent = eventTypes.find(e => e.value === selectedEvent);
  const strategies = templateStrategies[selectedEvent as keyof typeof templateStrategies] || [];
  const Icon = currentEvent?.icon || Mail;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header com gradiente */}
        <div className={cn(
          "relative overflow-hidden rounded-2xl p-8 text-white",
          "bg-gradient-to-br",
          currentEvent?.color || "from-gray-600 to-gray-800"
        )}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Templates Automáticos</h1>
                <p className="mt-1 text-lg text-white/80">
                  Templates otimizados por IA para máxima conversão
                </p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <Sparkles className="absolute right-8 top-8 h-8 w-8 text-white/20" />
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg transition-all hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Templates Ativos</CardTitle>
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-bold text-gray-900">26</span>
                <p className="mt-1 text-sm text-gray-500">12 tipos de evento</p>
              </div>
            </CardHeader>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg transition-all hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Taxa de Conversão</CardTitle>
                <div className="rounded-lg bg-green-500/10 p-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-bold text-gray-900">32%</span>
                <p className="mt-1 text-sm text-gray-500">Média geral</p>
              </div>
            </CardHeader>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg transition-all hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">A/B Testing</CardTitle>
                <div className="rounded-lg bg-purple-500/10 p-2">
                  <RefreshCw className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-bold text-gray-900">Ativo</span>
                <p className="mt-1 text-sm text-gray-500">Otimização contínua</p>
              </div>
            </CardHeader>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-orange-50 to-red-50 shadow-lg transition-all hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Personalização</CardTitle>
                <div className="rounded-lg bg-orange-500/10 p-2">
                  <Sparkles className="h-4 w-4 text-orange-600" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-bold text-gray-900">100%</span>
                <p className="mt-1 text-sm text-gray-500">Automática</p>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Event Types List */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b bg-gray-50/50">
                <CardTitle className="text-lg">Tipos de Evento</CardTitle>
                <CardDescription>Selecione para ver os templates</CardDescription>
              </CardHeader>
              <CardContent className="p-2">
                <div className="space-y-2">
                  {eventTypes.map((event) => {
                    const EventIcon = event.icon;
                    const isSelected = selectedEvent === event.value;
                    
                    return (
                      <button
                        key={event.value}
                        onClick={() => {
                          setSelectedEvent(event.value);
                          setSelectedTemplate(0);
                        }}
                        className={cn(
                          "w-full rounded-lg p-4 text-left transition-all",
                          "hover:shadow-md",
                          isSelected ? "shadow-lg" : "hover:bg-gray-50"
                        )}
                      >
                        <div className={cn(
                          "rounded-lg p-4",
                          isSelected && `bg-gradient-to-br ${event.bgColor}`
                        )}>
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "rounded-lg p-2",
                              isSelected ? "bg-white/80" : "bg-gray-100"
                            )}>
                              <EventIcon className={cn(
                                "h-5 w-5",
                                isSelected && `text-${event.color?.split('-')[1]}-600`
                              )} />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{event.label}</h4>
                              <p className="mt-1 text-sm text-gray-600">
                                {event.attempts} {event.attempts === 1 ? 'email' : 'emails'} na sequência
                              </p>
                              <p className="mt-2 text-xs text-gray-500">
                                {event.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Template Details and Preview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template Sequence */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {currentEvent?.label}
                    </CardTitle>
                    <CardDescription>Sequência de recuperação otimizada</CardDescription>
                  </div>
                  <Badge className={cn("bg-gradient-to-r text-white", currentEvent?.color)}>
                    {currentEvent?.attempts} tentativas
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {strategies.map((strategy, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedTemplate(index)}
                      className={cn(
                        "cursor-pointer rounded-lg border p-4 transition-all",
                        selectedTemplate === index
                          ? "border-indigo-500 bg-indigo-50/50 shadow-md"
                          : "hover:border-gray-300 hover:shadow-sm"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{strategy.emoji}</span>
                          <div>
                            <h4 className="font-medium">
                              {index + 1}ª Tentativa - {strategy.strategy}
                            </h4>
                            <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {strategy.delay}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {strategy.stats.open}% abertura
                              </span>
                              <span className="flex items-center gap-1">
                                <MousePointerClick className="h-3 w-3" />
                                {strategy.stats.click}% clique
                              </span>
                              <span className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {strategy.stats.conversion}% conversão
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Email Preview */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Preview do Email</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Smartphone className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Monitor className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <EmailPreview 
                  template={strategies[selectedTemplate]} 
                  eventType={selectedEvent}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 