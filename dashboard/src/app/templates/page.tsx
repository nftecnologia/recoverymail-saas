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
  MousePointerClick,
  Package,
  AlertCircle,
  Gift,
  Heart,
  Star,
  TrendingDown,
  UserCheck,
  Download,
  RefreshCcw,
  Copy,
  Edit,
  Save
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  { 
    value: "SALE_CHARGEBACK", 
    label: "Chargeback",
    icon: AlertCircle,
    color: "from-gray-500 to-slate-500",
    bgColor: "from-gray-50 to-slate-50",
    attempts: 1,
    description: "Notificação de contestação de pagamento"
  },
  { 
    value: "SALE_REFUNDED", 
    label: "Reembolso",
    icon: RefreshCw,
    color: "from-blue-500 to-cyan-500",
    bgColor: "from-blue-50 to-cyan-50",
    attempts: 1,
    description: "Confirmação de reembolso processado"
  },
  { 
    value: "BANK_SLIP_GENERATED", 
    label: "Boleto Gerado",
    icon: CreditCard,
    color: "from-indigo-500 to-purple-500",
    bgColor: "from-indigo-50 to-purple-50",
    attempts: 2,
    description: "Lembretes sobre boleto gerado"
  },
  { 
    value: "PIX_GENERATED", 
    label: "PIX Gerado",
    icon: Zap,
    color: "from-emerald-500 to-teal-500",
    bgColor: "from-emerald-50 to-teal-50",
    attempts: 2,
    description: "Urgência para pagamento PIX"
  },
  { 
    value: "SUBSCRIPTION_CANCELED", 
    label: "Assinatura Cancelada",
    icon: Users,
    color: "from-pink-500 to-rose-500",
    bgColor: "from-pink-50 to-rose-50",
    attempts: 3,
    description: "Sequência de reconquista do assinante"
  },
  { 
    value: "SUBSCRIPTION_EXPIRED", 
    label: "Assinatura Expirada",
    icon: Clock,
    color: "from-amber-500 to-yellow-500",
    bgColor: "from-amber-50 to-yellow-50",
    attempts: 3,
    description: "Renovação urgente da assinatura"
  },
  { 
    value: "SUBSCRIPTION_RENEWED", 
    label: "Assinatura Renovada",
    icon: CheckCircle,
    color: "from-green-500 to-lime-500",
    bgColor: "from-green-50 to-lime-50",
    attempts: 1,
    description: "Confirmação de renovação bem-sucedida"
  }
];

const templateExamples = {
  "ABANDONED_CART": {
    templates: [
      {
        name: "Lembrete Sutil",
        subject: "Você esqueceu algo especial...",
        timing: "15 minutos",
        preview: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">Olá, {{customerName}}! 👋</h1>
              <p style="margin: 20px 0 0 0; font-size: 18px; opacity: 0.9;">
                Notamos que você deixou algo especial no seu carrinho
              </p>
            </div>
            
            <div style="padding: 40px 20px; background-color: #f8f9fa;">
              <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-top: 0;">{{productName}}</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                  Sabemos que a vida fica corrida, mas que tal finalizar sua compra agora? 
                  Seu produto está reservado e pronto para transformar seus resultados.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="#" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                    Finalizar Compra
                  </a>
                </div>
                
                <p style="text-align: center; color: #999; font-size: 14px;">
                  ⏱️ Seu carrinho será mantido por mais 24 horas
                </p>
              </div>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
              <p>Se você não deseja mais receber esses e-mails, <a href="#" style="color: #667eea;">clique aqui</a></p>
            </div>
          </div>
        `
      },
      {
        name: "Urgência com Desconto",
        subject: "⚡ 15% OFF - Apenas hoje!",
        timing: "2 horas",
        preview: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 50px 20px; text-align: center;">
              <div style="background-color: white; color: #f5576c; display: inline-block; padding: 8px 20px; border-radius: 20px; margin-bottom: 20px;">
                <span style="font-weight: bold;">⚡ OFERTA ESPECIAL</span>
              </div>
              <h1 style="margin: 0; font-size: 32px;">15% OFF Exclusivo</h1>
              <p style="margin: 20px 0 0 0; font-size: 18px; opacity: 0.9;">
                {{customerName}}, essa é sua última chance!
              </p>
            </div>
            
            <div style="padding: 40px 20px; background-color: #f8f9fa;">
              <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <span style="background: #f5576c; color: white; padding: 10px 20px; border-radius: 6px; font-size: 24px; font-weight: bold;">
                    {{productPrice}} → {{discountPrice}}
                  </span>
                </div>
                
                <h2 style="color: #333; text-align: center; margin: 0 0 20px 0;">{{productName}}</h2>
                
                <div style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <p style="margin: 0; text-align: center; font-weight: bold; color: #d73527;">
                    🔥 Oferta expira em: 23:47:12
                  </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="#" style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);">
                    Garantir Desconto Agora
                  </a>
                </div>
                
                <div style="border-left: 4px solid #f5576c; padding-left: 15px; margin: 20px 0;">
                  <p style="margin: 0; color: #666; font-style: italic;">
                    "Depois de usar este produto, meus resultados melhoraram 300%!" - Ana Silva
                  </p>
                </div>
              </div>
            </div>
          </div>
        `
      },
      {
        name: "Última Tentativa",
        subject: "😢 Vamos sentir sua falta...",
        timing: "24 horas",
        preview: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; color: #333;">Que pena, {{customerName}}... 😢</h1>
              <p style="margin: 20px 0 0 0; font-size: 16px; color: #666;">
                Parece que {{productName}} não era exatamente o que você estava procurando.
              </p>
            </div>
            
            <div style="padding: 40px 20px; background-color: #f8f9fa;">
              <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <p style="color: #333; font-size: 16px; line-height: 1.6; margin-top: 0;">
                  Antes que você vá embora, gostaríamos de fazer uma última oferta especial:
                </p>
                
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;">
                  <h3 style="color: white; margin: 0 0 10px 0;">Cupom Exclusivo: VOLTEI30</h3>
                  <p style="color: white; margin: 0; opacity: 0.9;">30% de desconto válido por 7 dias</p>
                </div>
                
                <p style="color: #666; font-size: 14px; text-align: center; margin: 20px 0;">
                  Pode usar a qualquer momento nos próximos 7 dias.<br>
                  Sem pressa, sem pressão. 😊
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="#" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    Usar Cupom VOLTEI30
                  </a>
                </div>
                
                <p style="color: #999; font-size: 14px; text-align: center; margin: 30px 0 0 0;">
                  E se não rolar, tudo bem! Continuamos aqui quando precisar. ❤️
                </p>
              </div>
            </div>
          </div>
        `
      }
    ]
  },
  
  "PIX_EXPIRED": {
    templates: [
      {
        name: "PIX Expirado - Gerar Novo",
        subject: "Seu PIX expirou - Gere outro em 30 segundos",
        timing: "Imediato",
        preview: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center;">
              <div style="background-color: white; color: #f39c12; display: inline-block; padding: 10px 20px; border-radius: 20px; margin-bottom: 20px;">
                <span style="font-weight: bold;">⏰ PIX EXPIRADO</span>
              </div>
              <h1 style="margin: 0; font-size: 28px;">Ops! Seu PIX expirou</h1>
              <p style="margin: 20px 0 0 0; font-size: 16px; opacity: 0.9;">
                Mas não se preocupe, {{customerName}}! Vamos gerar um novo para você.
              </p>
            </div>
            
            <div style="padding: 40px 20px; background-color: #f8f9fa;">
              <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-top: 0; text-align: center;">{{productName}}</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6; text-align: center;">
                  Valor: <strong style="color: #27ae60; font-size: 24px;">{{productPrice}}</strong>
                </p>
                
                <div style="background: linear-gradient(135deg, #f1c40f 0%, #f39c12 100%); border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                  <p style="margin: 0; font-weight: bold; color: white;">
                    ⚡ Gere seu novo PIX em apenas 30 segundos
                  </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="#" style="display: inline-block; background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); color: white; padding: 20px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">
                    Gerar Novo PIX
                  </a>
                </div>
                
                <p style="color: #7f8c8d; font-size: 14px; text-align: center; margin: 20px 0 0 0;">
                  💡 Dica: O PIX é válido por 30 minutos após a geração
                </p>
              </div>
            </div>
          </div>
        `
      },
      {
        name: "Última Chance PIX",
        subject: "⚠️ Última chance - Produto pode sair do ar",
        timing: "1 hora",
        preview: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 40px 20px; text-align: center;">
              <div style="background-color: white; color: #e74c3c; display: inline-block; padding: 10px 20px; border-radius: 20px; margin-bottom: 20px;">
                <span style="font-weight: bold;">⚠️ ÚLTIMA CHANCE</span>
              </div>
              <h1 style="margin: 0; font-size: 28px;">{{customerName}}, estoque se esgotando!</h1>
              <p style="margin: 20px 0 0 0; font-size: 16px; opacity: 0.9;">
                Apenas <strong>3 unidades</strong> restantes de {{productName}}
              </p>
            </div>
            
            <div style="padding: 40px 20px; background-color: #f8f9fa;">
              <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 25px;">
                  <div style="background: #e74c3c; color: white; display: inline-block; padding: 15px 25px; border-radius: 50px; font-weight: bold; font-size: 18px;">
                    🔥 APENAS 3 UNIDADES
                  </div>
                </div>
                
                <h2 style="color: #333; margin: 0 0 15px 0; text-align: center;">{{productName}}</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6; text-align: center;">
                  Valor: <strong style="color: #27ae60; font-size: 24px;">{{productPrice}}</strong>
                </p>
                
                <div style="background: linear-gradient(135deg, #ff7675 0%, #fd79a8 100%); border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                  <p style="margin: 0; font-weight: bold; color: white; font-size: 16px;">
                    ⏰ Produto pode sair do ar a qualquer momento
                  </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="#" style="display: inline-block; background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 20px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(231, 76, 60, 0.4);">
                    Gerar PIX - Última Chance
                  </a>
                </div>
                
                <div style="border: 2px dashed #e74c3c; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; color: #e74c3c; font-weight: bold; text-align: center;">
                    ⚡ Este é seu último e-mail sobre este produto
                  </p>
                </div>
              </div>
            </div>
          </div>
        `
      }
    ]
  }
};

export default function TemplatesPage() {
  const [selectedEventType, setSelectedEventType] = useState("ABANDONED_CART");
  const [selectedTemplate, setSelectedTemplate] = useState(0);

  const currentEventType = eventTypes.find(et => et.value === selectedEventType);
  const currentTemplates = templateExamples[selectedEventType as keyof typeof templateExamples]?.templates || [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Templates de Email</h1>
          <p className="text-muted-foreground mt-2">
            Sequências de recuperação otimizadas para cada tipo de evento
          </p>
        </div>

        {/* Event Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {eventTypes.map((eventType) => {
            const Icon = eventType.icon;
            const isSelected = selectedEventType === eventType.value;
            
            return (
              <Card 
                key={eventType.value}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-md border-2",
                  isSelected ? "border-blue-500 shadow-lg" : "border-transparent hover:border-gray-200"
                )}
                onClick={() => setSelectedEventType(eventType.value)}
              >
                <CardHeader className="pb-4">
                  <div className={cn(
                    "w-full h-20 rounded-lg bg-gradient-to-r flex items-center justify-center mb-3",
                    eventType.bgColor
                  )}>
                    <div className={cn(
                      "w-12 h-12 rounded-full bg-gradient-to-r flex items-center justify-center",
                      eventType.color
                    )}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{eventType.label}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {eventType.attempts} emails
                    </Badge>
                  </div>
                  
                  <CardDescription className="text-xs leading-relaxed">
                    {eventType.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Selected Event Details */}
        {currentEventType && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-full bg-gradient-to-r flex items-center justify-center",
                  currentEventType.color
                )}>
                  <currentEventType.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">{currentEventType.label}</CardTitle>
                  <CardDescription className="text-sm">
                    {currentEventType.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {currentTemplates.length > 0 && (
                <Tabs value={selectedTemplate.toString()} onValueChange={(v) => setSelectedTemplate(parseInt(v))}>
                  <div className="border-b px-6 pt-6">
                    <TabsList className="grid w-full grid-cols-3">
                      {currentTemplates.map((template, index) => (
                        <TabsTrigger key={index} value={index.toString()} className="text-xs">
                          Email {index + 1}: {template.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {currentTemplates.map((template, index) => (
                    <TabsContent key={index} value={index.toString()} className="mt-0">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                        {/* Template Info */}
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold text-lg">{template.name}</h3>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>Envio: {template.timing}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                <span>Assunto: {template.subject}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">Configurações</h4>
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Timing de envio:</span>
                                <Badge variant="outline">{template.timing}</Badge>
                              </div>
                              <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Taxa de abertura:</span>
                                <span className="font-medium text-green-600">
                                  {index === 0 ? '68%' : index === 1 ? '45%' : '32%'}
                                </span>
                              </div>
                              <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Taxa de clique:</span>
                                <span className="font-medium text-blue-600">
                                  {index === 0 ? '23%' : index === 1 ? '31%' : '18%'}
                                </span>
                              </div>
                              <div className="flex justify-between py-2">
                                <span className="text-muted-foreground">Conversão:</span>
                                <span className="font-medium text-purple-600">
                                  {index === 0 ? '12%' : index === 1 ? '19%' : '8%'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button className="flex-1">
                              <Save className="h-4 w-4 mr-2" />
                              Salvar Alterações
                            </Button>
                            <Button variant="outline" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon">
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Email Preview */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Preview do Email</h4>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Smartphone className="h-4 w-4 mr-1" />
                                Mobile
                              </Button>
                              <Button variant="outline" size="sm">
                                <Monitor className="h-4 w-4 mr-1" />
                                Desktop
                              </Button>
                            </div>
                          </div>
                          
                          <div className="border rounded-lg bg-gray-50 p-4">
                            <div className="bg-white rounded border shadow-sm">
                              <div className="border-b p-3 bg-gray-50 text-sm">
                                <div className="font-medium">Para: cliente@exemplo.com</div>
                                <div className="text-muted-foreground">Assunto: {template.subject}</div>
                              </div>
                              <ScrollArea className="h-96">
                                <div 
                                  className="p-0"
                                  dangerouslySetInnerHTML={{ __html: template.preview }}
                                />
                              </ScrollArea>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              )}
              
              {currentTemplates.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Templates em desenvolvimento para este evento.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}