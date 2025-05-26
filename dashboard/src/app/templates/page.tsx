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
  UserCheck
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
    icon: FileText,
    color: "from-indigo-500 to-blue-500",
    bgColor: "from-indigo-50 to-blue-50",
    attempts: 2,
    description: "Lembrete para pagamento do boleto"
  },
  { 
    value: "PIX_GENERATED", 
    label: "PIX Gerado",
    icon: Zap,
    color: "from-green-500 to-teal-500",
    bgColor: "from-green-50 to-teal-50",
    attempts: 1,
    description: "QR Code PIX para pagamento rápido"
  },
  { 
    value: "SUBSCRIPTION_CANCELED", 
    label: "Assinatura Cancelada",
    icon: UserCheck,
    color: "from-amber-500 to-yellow-500",
    bgColor: "from-amber-50 to-yellow-50",
    attempts: 3,
    description: "Estratégia de win-back para assinantes"
  },
  { 
    value: "SUBSCRIPTION_EXPIRED", 
    label: "Assinatura Expirada",
    icon: TrendingDown,
    color: "from-rose-500 to-red-500",
    bgColor: "from-rose-50 to-red-50",
    attempts: 2,
    description: "Incentivo para renovação da assinatura"
  },
  { 
    value: "SUBSCRIPTION_RENEWED", 
    label: "Assinatura Renovada",
    icon: Star,
    color: "from-emerald-500 to-green-500",
    bgColor: "from-emerald-50 to-green-50",
    attempts: 1,
    description: "Confirmação de renovação com benefícios"
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
  ],
  SALE_CHARGEBACK: [
    { 
      delay: "Imediato", 
      strategy: "Notificação urgente", 
      emoji: "⚠️",
      subject: "⚠️ Importante: Contestação em seu pagamento",
      preview: "Precisamos de sua atenção urgente...",
      stats: { open: 92, click: 75, conversion: 0 }
    }
  ],
  SALE_REFUNDED: [
    { 
      delay: "5 segundos", 
      strategy: "Confirmação de reembolso", 
      emoji: "💰",
      subject: "💰 Reembolso processado com sucesso",
      preview: "Seu dinheiro está a caminho...",
      stats: { open: 88, click: 45, conversion: 0 }
    }
  ],
  BANK_SLIP_GENERATED: [
    { 
      delay: "30 minutos", 
      strategy: "Instruções de pagamento", 
      emoji: "📄",
      subject: "📄 Seu boleto está pronto!",
      preview: "Pague até o vencimento e garanta seu acesso...",
      stats: { open: 72, click: 55, conversion: 40 }
    },
    { 
      delay: "3 dias", 
      strategy: "Lembrete de vencimento", 
      emoji: "📅",
      subject: "📅 Lembrete: Seu boleto vence em breve",
      preview: "Não perca o prazo de pagamento...",
      stats: { open: 65, click: 42, conversion: 30 }
    }
  ],
  PIX_GENERATED: [
    { 
      delay: "5 minutos", 
      strategy: "QR Code e instruções", 
      emoji: "📱",
      subject: "📱 PIX: Pague em segundos!",
      preview: "Escaneie o QR Code e finalize agora...",
      stats: { open: 82, click: 68, conversion: 55 }
    }
  ],
  SUBSCRIPTION_CANCELED: [
    { 
      delay: "1 hora", 
      strategy: "Confirmação e alternativas", 
      emoji: "😢",
      subject: "😢 Sentiremos sua falta, {nome}",
      preview: "Sua assinatura foi cancelada, mas...",
      stats: { open: 75, click: 35, conversion: 15 }
    },
    { 
      delay: "7 dias", 
      strategy: "Oferta de retorno", 
      emoji: "🎁",
      subject: "🎁 Volte com 30% de desconto!",
      preview: "Já se passou um mês desde que você cancelou. Que tal voltar com um super desconto e continuar sua jornada de aprendizado?",
      stats: { open: 68, click: 42, conversion: 30 }
    },
    { 
      delay: "30 dias", 
      strategy: "Volte com 30% de desconto!",
      emoji: "🎁",
      subject: "🎁 Volte com 30% de desconto!",
      preview: "Já se passou um mês desde que você cancelou. Que tal voltar com um super desconto e continuar sua jornada de aprendizado?",
      stats: { open: 68, click: 42, conversion: 30 }
    }
  ],
  SUBSCRIPTION_EXPIRED: [
    { 
      delay: "3 dias antes", 
      strategy: "Aviso prévio", 
      emoji: "⏳",
      subject: "⏳ Sua assinatura expira em 3 dias",
      preview: "Renove agora e não perca o acesso...",
      stats: { open: 78, click: 52, conversion: 30 }
    },
    { 
      delay: "1 dia depois", 
      strategy: "Oferta de renovação", 
      emoji: "🔄",
      subject: "🔄 Renove com 20% de desconto",
      preview: "Renove agora e não perca o acesso...",
      stats: { open: 70, click: 45, conversion: 30 }
    }
  ],
  SUBSCRIPTION_RENEWED: [
    { 
      delay: "Imediato", 
      strategy: "Agradecimento e benefícios", 
      emoji: "🎉",
      subject: "🎉 Obrigado por renovar, {nome}!",
      preview: "Confira seus benefícios exclusivos...",
      stats: { open: 90, click: 65, conversion: 0 }
    }
  ]
};

// Templates HTML completos para cada tipo de email
const getEmailTemplate = (eventType: string, attemptIndex: number) => {
  const templates: { [key: string]: { [key: number]: string } } = {
    ABANDONED_CART: {
      0: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1a1a1a; color: white; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🛒 Você esqueceu alguns itens especiais!</h1>
          </div>
          
          <div style="padding: 40px 20px; background-color: white;">
            <p style="font-size: 18px; color: #1a1a1a; margin-bottom: 20px;">Olá João,</p>
            
            <p style="font-size: 16px; color: #666; margin-bottom: 30px;">
              Notamos que você deixou alguns itens incríveis no seu carrinho. 
              Que tal finalizar sua compra agora e garantir esses produtos?
            </p>
            
            <div style="border-top: 1px solid #eee; border-bottom: 1px solid #eee; padding: 20px 0; margin: 30px 0;">
              <div style="display: flex; align-items: center; margin-bottom: 20px;">
                <img src="https://via.placeholder.com/100" alt="Curso" style="width: 100px; height: 100px; border-radius: 8px; margin-right: 20px;">
                <div>
                  <h3 style="margin: 0 0 5px 0; color: #1a1a1a;">Curso de Marketing Digital Avançado</h3>
                  <p style="margin: 0; font-size: 18px; color: #e74c3c; font-weight: bold;">R$ 497,00</p>
                  <p style="margin: 5px 0 0 0; color: #999; font-size: 14px;">Quantidade: 1</p>
                </div>
              </div>
            </div>
            
            <div style="text-align: right; font-size: 20px; margin: 20px 0;">
              Total: <strong style="color: #e74c3c;">R$ 497,00</strong>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="#" style="display: inline-block; background-color: #27ae60; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
                Finalizar Compra Agora
              </a>
              
              <p style="margin-top: 20px; font-size: 14px; color: #999;">
                Seus itens estão reservados por tempo limitado. 
                Não perca essa oportunidade!
              </p>
            </div>
            
            <div style="background-color: #fff8e1; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h4 style="margin: 0 0 10px 0; color: #f57c00;">💡 Dica:</h4>
              <p style="margin: 0; color: #666;">
                Entre no nosso grupo exclusivo de alunos no WhatsApp para tirar dúvidas 
                e fazer networking com outros estudantes!
              </p>
              <a href="#" style="display: inline-block; margin-top: 10px; color: #f57c00; text-decoration: underline;">
                Entrar no grupo VIP →
              </a>
            </div>
          </div>
        </div>
      `,
      1: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 40px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">⏰ Últimas unidades disponíveis!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Seus itens podem acabar a qualquer momento</p>
          </div>
          
          <div style="padding: 40px 20px; background-color: white;">
            <p style="font-size: 18px; color: #1a1a1a; margin-bottom: 20px;">João, não perca essa oportunidade!</p>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h3 style="margin: 0 0 10px 0; color: #856404;">⚠️ Atenção:</h3>
              <p style="margin: 0; color: #666;">
                Mais de 50 pessoas visualizaram este produto nas últimas 24 horas. 
                O estoque está acabando rapidamente!
              </p>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="#" style="display: inline-block; background-color: #ffa726; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 20px; font-weight: bold; box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);">
                Garantir Meu Acesso Agora
              </a>
              
              <p style="margin-top: 20px; color: #666;">
                <a href="#" style="color: #666; text-decoration: underline;">Prefere outro método de pagamento?</a>
              </p>
            </div>
            
            <div style="background-color: #fff8e1; border-radius: 8px; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #f57c00;">
                ⚠️ <strong>Aviso:</strong> Após esta oferta expirar, você precisará 
                pagar o valor integral para voltar a ser assinante.
              </p>
            </div>
          </div>
        </div>
      `,
      2: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 50px 20px; text-align: center;">
            <div style="background-color: white; color: #f5576c; display: inline-block; padding: 10px 30px; border-radius: 30px; margin-bottom: 20px;">
              <span style="font-size: 18px; font-weight: bold;">🎁 OFERTA ESPECIAL</span>
            </div>
            <h1 style="margin: 0; font-size: 32px;">Volte com 30% de desconto!</h1>
            <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.9;">Válido por 48 horas</p>
          </div>
          
          <div style="padding: 40px 20px; background-color: white;">
            <p style="font-size: 18px; color: #1a1a1a; margin-bottom: 20px;">João, não queremos que você perca essa oportunidade!</p>
            
            <div style="background-color: #fee; border: 2px solid #f5576c; border-radius: 8px; padding: 25px; margin-bottom: 30px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 24px; font-weight: bold; color: #f5576c;">
                De <span style="text-decoration: line-through;">R$ 97,00</span> por:
              </p>
              <p style="margin: 0; font-size: 48px; font-weight: bold; color: #27ae60;">
                R$ 77,60
              </p>
              <p style="margin: 10px 0 0 0; color: #666;">
                por mês (economia de R$ 19,40)
              </p>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px 60px; text-decoration: none; border-radius: 8px; font-size: 20px; font-weight: bold; box-shadow: 0 4px 20px rgba(245, 87, 108, 0.3);">
                Reativar com 30% OFF
              </a>
              
              <div style="margin-top: 20px;">
                <p style="color: #f5576c; font-weight: bold;">
                  ⏰ Oferta expira em:
                </p>
                <p style="font-size: 24px; font-weight: bold; color: #333;">
                  47:59:32
                </p>
              </div>
            </div>
            
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h4 style="margin: 0 0 15px 0;">O que nossos alunos conquistaram este mês:</h4>
              
              <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
                <p style="margin: 0 0 5px 0; font-weight: bold;">Maria Silva</p>
                <p style="margin: 0; color: #666; font-style: italic;">
                  "Fechei 3 clientes novos aplicando as estratégias do curso!"
                </p>
              </div>
              
              <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
                <p style="margin: 0 0 5px 0; font-weight: bold;">Carlos Santos</p>
                <p style="margin: 0; color: #666; font-style: italic;">
                  "Meu faturamento aumentou 40% em apenas 2 meses"
                </p>
              </div>
              
              <div>
                <p style="margin: 0 0 5px 0; font-weight: bold;">Ana Costa</p>
                <p style="margin: 0; color: #666; font-style: italic;">
                  "Finalmente entendi como fazer anúncios que convertem!"
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px 60px; text-decoration: none; border-radius: 8px; font-size: 20px; font-weight: bold; box-shadow: 0 4px 20px rgba(245, 87, 108, 0.3);">
                Reativar com 30% OFF
              </a>
              
              <div style="margin-top: 20px;">
                <p style="color: #f5576c; font-weight: bold;">
                  ⏰ Oferta expira em:
                </p>
                <p style="font-size: 24px; font-weight: bold; color: #333;">
                  47:59:32
                </p>
              </div>
            </div>
            
            <div style="background-color: #e3f2fd; border-radius: 8px; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #1565c0;">
                💡 <strong>Dica:</strong> Mude para o plano anual e economize 2 meses!
              </p>
              <a href="#" style="color: #1565c0; text-decoration: underline; font-weight: bold;">
                Ver plano anual →
              </a>
            </div>
          </div>
        </div>
      `,
      3: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 50px 20px; text-align: center;">
            <div style="background-color: white; color: #f5576c; display: inline-block; padding: 10px 30px; border-radius: 30px; margin-bottom: 20px;">
              <span style="font-size: 18px; font-weight: bold;">🎁 OFERTA ESPECIAL</span>
            </div>
            <h1 style="margin: 0; font-size: 32px;">Volte com 30% de desconto!</h1>
            <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.9;">Válido por 48 horas</p>
          </div>
          
          <div style="padding: 40px 20px; background-color: white;">
            <p style="font-size: 18px; color: #1a1a1a; margin-bottom: 20px;">João, não queremos que você perca essa oportunidade!</p>
            
            <div style="background-color: #fee; border: 2px solid #f5576c; border-radius: 8px; padding: 25px; margin-bottom: 30px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 24px; font-weight: bold; color: #f5576c;">
                De <span style="text-decoration: line-through;">R$ 97,00</span> por:
              </p>
              <p style="margin: 0; font-size: 48px; font-weight: bold; color: #27ae60;">
                R$ 77,60
              </p>
              <p style="margin: 10px 0 0 0; color: #666;">
                por mês (economia de R$ 19,40)
              </p>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px 60px; text-decoration: none; border-radius: 8px; font-size: 20px; font-weight: bold; box-shadow: 0 4px 20px rgba(245, 87, 108, 0.3);">
                Reativar com 30% OFF
              </a>
              
              <div style="margin-top: 20px;">
                <p style="color: #f5576c; font-weight: bold;">
                  ⏰ Oferta expira em:
                </p>
                <p style="font-size: 24px; font-weight: bold; color: #333;">
                  47:59:32
                </p>
              </div>
            </div>
            
            <div style="background-color: #e3f2fd; border-radius: 8px; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #1565c0;">
                💡 <strong>Dica:</strong> Mude para o plano anual e economize 2 meses!
              </p>
              <a href="#" style="color: #1565c0; text-decoration: underline; font-weight: bold;">
                Ver plano anual →
              </a>
            </div>
          </div>
        </div>
      `
    },
    PIX_EXPIRED: {
      0: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">⚡ Seu PIX está expirando!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Apenas 15 minutos restantes</p>
          </div>
          
          <div style="padding: 40px 20px; background-color: white;">
            <p style="font-size: 18px; color: #1a1a1a; margin-bottom: 20px;">Olá João,</p>
            
            <div style="background-color: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
              <h3 style="margin: 0 0 10px 0; color: #856404;">⏰ Atenção: PIX expira em 15 minutos!</h3>
              <p style="margin: 0; color: #666;">
                Copie o código abaixo e faça o pagamento agora mesmo para garantir seu acesso.
              </p>
            </div>
            
            <div style="background-color: #f8f9fa; border: 2px dashed #6c757d; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Código PIX Copia e Cola:</p>
              <code style="display: block; background-color: #e9ecef; padding: 15px; border-radius: 4px; font-size: 12px; word-break: break-all; color: #495057;">
                00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000
              </code>
              <button style="margin-top: 15px; background-color: #6c757d; color: white; border: none; padding: 10px 30px; border-radius: 4px; cursor: pointer;">
                Copiar Código
              </button>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <p style="margin-bottom: 20px; color: #666;">Ou escaneie o QR Code:</p>
              <img src="https://via.placeholder.com/200x200" alt="QR Code PIX" style="border: 2px solid #e9ecef; border-radius: 8px;">
            </div>
            
            <div style="background-color: #e8f5e9; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h4 style="margin: 0 0 10px 0; color: #2e7d32;">✅ Vantagens do pagamento via PIX:</h4>
              <ul style="margin: 0; padding-left: 20px; color: #666;">
                <li>Aprovação instantânea</li>
                <li>Acesso liberado em segundos</li>
                <li>Sem taxas adicionais</li>
                <li>100% seguro</li>
              </ul>
            </div>
          </div>
        </div>
      `,
      1: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 40px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🎯 Última chance: Novo PIX gerado!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Válido por 24 horas</p>
          </div>
          
          <div style="padding: 40px 20px; background-color: white;">
            <p style="font-size: 18px; color: #1a1a1a; margin-bottom: 20px;">João, geramos um novo código PIX para você!</p>
            
            <div style="background-color: #e3f2fd; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h3 style="margin: 0 0 10px 0; color: #1565c0;">💙 Oferta especial para você:</h3>
              <p style="margin: 0; color: #666;">
                Complete o pagamento nas próximas 2 horas e ganhe um bônus exclusivo!
              </p>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="#" style="display: inline-block; background-color: #4caf50; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
                Pagar com PIX Agora
              </a>
              
              <p style="margin-top: 20px; font-size: 14px; color: #999;">
                Ou use outro método de pagamento
              </p>
              
              <div style="margin-top: 20px;">
                <a href="#" style="display: inline-block; margin: 0 10px; padding: 10px 20px; border: 1px solid #ddd; border-radius: 4px; text-decoration: none; color: #666;">
                  💳 Cartão
                </a>
                <a href="#" style="display: inline-block; margin: 0 10px; padding: 10px 20px; border: 1px solid #ddd; border-radius: 4px; text-decoration: none; color: #666;">
                  📄 Boleto
                </a>
              </div>
            </div>
          </div>
        </div>
      `
    },
    BANK_SLIP_EXPIRED: {
      0: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #ff9800; color: white; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">📋 Seu boleto venceu ontem</h1>
          </div>
          
          <div style="padding: 40px 20px; background-color: white;">
            <p style="font-size: 18px; color: #1a1a1a; margin-bottom: 20px;">Olá João,</p>
            
            <p style="font-size: 16px; color: #666; margin-bottom: 30px;">
              Identificamos que seu boleto venceu ontem, mas não se preocupe! 
              Já geramos um novo boleto para você continuar com sua compra.
            </p>
            
            <div style="background-color: #fff8e1; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
              <h3 style="margin: 0 0 10px 0; color: #f57c00;">Novo boleto disponível</h3>
              <p style="margin: 0 0 20px 0; color: #666;">Vencimento: 3 dias úteis</p>
              
              <a href="#" style="display: inline-block; background-color: #ff9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Baixar Novo Boleto
              </a>
            </div>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                💡 Dica: Pague com PIX e tenha aprovação instantânea!
              </p>
              <a href="#" style="color: #1976d2; text-decoration: underline;">
                Pagar com PIX agora →
              </a>
            </div>
          </div>
        </div>
      `,
      1: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ffa726 0%, #fb8c00 100%); color: white; padding: 40px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">💳 Que tal mudar para PIX ou Cartão?</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Aprovação instantânea!</p>
          </div>
          
          <div style="padding: 40px 20px; background-color: white;">
            <p style="font-size: 18px; color: #1a1a1a; margin-bottom: 20px;">João, facilite sua vida!</p>
            
            <div style="margin: 30px 0;">
              <div style="background-color: #e8f5e9; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
                <h4 style="margin: 0 0 10px 0; color: #2e7d32;">⚡ PIX - Aprovação em segundos</h4>
                <ul style="margin: 0; padding-left: 20px; color: #666;">
                  <li>Acesso liberado instantaneamente</li>
                  <li>Sem burocracia</li>
                  <li>Desconto de 5% à vista</li>
                </ul>
                <a href="#" style="display: inline-block; margin-top: 15px; background-color: #4caf50; color: white; padding: 10px 25px; text-decoration: none; border-radius: 4px;">
                  Pagar com PIX
                </a>
              </div>
              
              <div style="background-color: #e3f2fd; border-radius: 8px; padding: 20px;">
                <h4 style="margin: 0 0 10px 0; color: #1565c0;">💳 Cartão - Parcele em até 12x</h4>
                <ul style="margin: 0; padding-left: 20px; color: #666;">
                  <li>Aprovação em minutos</li>
                  <li>Parcele sem juros</li>
                  <li>Aceita todos os cartões</li>
                </ul>
                <a href="#" style="display: inline-block; margin-top: 15px; background-color: #2196f3; color: white; padding: 10px 25px; text-decoration: none; border-radius: 4px;">
                  Pagar com Cartão
                </a>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 14px;">
                Ainda prefere boleto? 
                <a href="#" style="color: #ff9800; text-decoration: underline;">Gerar novo boleto</a>
              </p>
            </div>
          </div>
        </div>
      `,
      2: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 50px 20px; text-align: center;">
            <div style="background-color: white; color: #ee5a24; display: inline-block; padding: 10px 30px; border-radius: 30px; margin-bottom: 20px;">
              <span style="font-size: 18px; font-weight: bold;">🎯 ÚLTIMA CHANCE</span>
            </div>
            <h1 style="margin: 0; font-size: 32px;">15% OFF no PIX!</h1>
            <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.9;">Oferta válida por 48 horas</p>
          </div>
          
          <div style="padding: 40px 20px; background-color: white;">
            <p style="font-size: 18px; color: #1a1a1a; margin-bottom: 20px;">João, esta é sua última oportunidade!</p>
            
            <div style="background-color: #fee; border: 2px solid #f5576c; border-radius: 8px; padding: 25px; margin-bottom: 30px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 24px; font-weight: bold; color: #f5576c;">
                De <span style="text-decoration: line-through;">R$ 497,00</span> por:
              </p>
              <p style="margin: 0; font-size: 48px; font-weight: bold; color: #27ae60;">
                R$ 422,45
              </p>
              <p style="margin: 10px 0 0 0; color: #666;">
                no PIX (economia de R$ 74,55)
              </p>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 20px 60px; text-decoration: none; border-radius: 8px; font-size: 20px; font-weight: bold; box-shadow: 0 4px 20px rgba(238, 90, 36, 0.3);">
                Garantir 15% de Desconto
              </a>
              
              <div style="margin-top: 20px;">
                <p style="color: #ee5a24; font-weight: bold;">
                  ⏰ Oferta expira em:
                </p>
                <p style="font-size: 24px; font-weight: bold; color: #333;">
                  47:59:32
                </p>
              </div>
            </div>
            
            <div style="background-color: #fff3cd; border-radius: 8px; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #856404;">
                ⚠️ Após esta oferta, o valor volta para R$ 497,00
              </p>
            </div>
          </div>
        </div>
      `
    },
    SALE_REFUSED: {
      0: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #dc3545; color: white; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🔄 Ops! Tivemos um problema com seu pagamento</h1>
          </div>
          
          <div style="padding: 40px 20px; background-color: white;">
            <p style="font-size: 18px; color: #1a1a1a; margin-bottom: 20px;">Olá João,</p>
            
            <p style="font-size: 16px; color: #666; margin-bottom: 30px;">
              Infelizmente seu pagamento não foi aprovado pela operadora do cartão. 
              Mas não se preocupe, isso é mais comum do que você imagina!
            </p>
            
            <div style="background-color: #f8d7da; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h4 style="margin: 0 0 10px 0; color: #721c24;">Possíveis motivos:</h4>
              <ul style="margin: 0; padding-left: 20px; color: #721c24;">
                <li>Limite insuficiente</li>
                <li>Cartão bloqueado para compras online</li>
                <li>Dados incorretos</li>
                <li>Sistema antifraude do banco</li>
              </ul>
            </div>
            
            <div style="background-color: #d4edda; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h4 style="margin: 0 0 15px 0; color: #155724;">✅ Soluções rápidas:</h4>
              
              <div style="margin-bottom: 15px;">
                <a href="#" style="display: inline-block; background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                  Tentar Novamente
                </a>
                <span style="margin-left: 10px; color: #666;">Com o mesmo cartão</span>
              </div>
              
              <div style="margin-bottom: 15px;">
                <a href="#" style="display: inline-block; background-color: #17a2b8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                  Usar Outro Cartão
                </a>
                <span style="margin-left: 10px; color: #666;">Tente com outro cartão</span>
              </div>
              
              <div>
                <a href="#" style="display: inline-block; background-color: #ffc107; color: #212529; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                  Pagar com PIX
                </a>
                <span style="margin-left: 10px; color: #666;">Aprovação garantida!</span>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 14px;">
                Precisa de ajuda? 
                <a href="#" style="color: #007bff; text-decoration: underline;">Fale com nosso suporte</a>
              </p>
            </div>
          </div>
        </div>
      `,
      1: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🤝 João, podemos ajudar com seu pagamento?</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Nossa equipe está pronta para auxiliar</p>
          </div>
          
          <div style="padding: 40px 20px; background-color: white;">
            <p style="font-size: 18px; color: #1a1a1a; margin-bottom: 20px;">Ainda não conseguiu finalizar sua compra?</p>
            
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px; text-align: center;">
              <h3 style="margin: 0 0 15px 0; color: #495057;">💬 Fale com um especialista</h3>
              <p style="margin: 0 0 20px 0; color: #666;">
                Nossa equipe pode ajudar com formas alternativas de pagamento, 
                parcelamento personalizado ou tirar suas dúvidas.
              </p>
              
              <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
                <a href="#" style="display: inline-block; background-color: #25d366; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                  WhatsApp
                </a>
                <a href="#" style="display: inline-block; background-color: #0084ff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                  Chat Online
                </a>
                <a href="#" style="display: inline-block; background-color: #6c757d; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                  E-mail
                </a>
              </div>
            </div>
            
            <div style="background-color: #e7f3ff; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h4 style="margin: 0 0 10px 0; color: #004085;">🎁 Oferta especial para você:</h4>
              <p style="margin: 0; color: #004085;">
                Converse com nossa equipe e ganhe 10% de desconto + 
                condições especiais de pagamento!
              </p>
            </div>
            
            <div style="text-align: center;">
              <p style="color: #666; font-size: 14px;">
                Ou se preferir, 
                <a href="#" style="color: #667eea; text-decoration: underline; font-weight: bold;">
                  tente novamente com outro método de pagamento
                </a>
              </p>
            </div>
          </div>
        </div>
      `
    },
    SALE_APPROVED: {
      0: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 50px 20px; text-align: center;">
            <div style="background-color: white; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 40px;">✅</span>
            </div>
            <h1 style="margin: 0; font-size: 32px;">Parabéns, João!</h1>
            <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.9;">Seu pagamento foi aprovado com sucesso</p>
          </div>
          
          <div style="padding: 40px 20px; background-color: white;">
            <div style="background-color: #d4edda; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
              <h3 style="margin: 0 0 10px 0; color: #155724;">🎉 Bem-vindo ao curso!</h3>
              <p style="margin: 0; color: #155724;">
                Seu acesso já está liberado. Vamos começar sua jornada de aprendizado!
              </p>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 20px 60px; text-decoration: none; border-radius: 8px; font-size: 20px; font-weight: bold; box-shadow: 0 4px 20px rgba(56, 239, 125, 0.3);">
                Acessar o Curso Agora
              </a>
            </div>
            
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin: 30px 0;">
              <h4 style="margin: 0 0 20px 0; text-align: center;">📚 Primeiros passos:</h4>
              
              <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #dee2e6;">
                <div style="display: flex; align-items: start; gap: 15px;">
                  <span style="background-color: #38ef7d; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">1</span>
                  <div>
                    <h5 style="margin: 0 0 5px 0;">Complete seu perfil</h5>
                    <p style="margin: 0; color: #666; font-size: 14px;">
                      Adicione sua foto e informações para personalizar sua experiência
                    </p>
                  </div>
                </div>
              </div>
              
              <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #dee2e6;">
                <div style="display: flex; align-items: start; gap: 15px;">
                  <span style="background-color: #38ef7d; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">2</span>
                  <div>
                    <h5 style="margin: 0 0 5px 0;">Entre no grupo VIP</h5>
                    <p style="margin: 0; color: #666; font-size: 14px;">
                      Conecte-se com outros alunos e tire dúvidas diretamente
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <div style="display: flex; align-items: start; gap: 15px;">
                  <span style="background-color: #38ef7d; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">3</span>
                  <div>
                    <h5 style="margin: 0 0 5px 0;">Assista a aula de boas-vindas</h5>
                    <p style="margin: 0; color: #666; font-size: 14px;">
                      Entenda como aproveitar ao máximo o conteúdo do curso
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div style="background-color: #fff3cd; border-radius: 8px; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #856404;">
                💡 <strong>Dica:</strong> Reserve 30 minutos por dia para estudar e 
                veja resultados em menos de 30 dias!
              </p>
            </div>
          </div>
        </div>
      `
    },
    SALE_CHARGEBACK: {
      0: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #dc3545; color: white; padding: 40px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">⚠️ Importante: Contestação em seu pagamento</h1>
          </div>
          
          <div style="padding: 40px 20px; background-color: white;">
            <p style="font-size: 18px; color: #1a1a1a; margin-bottom: 20px;">Olá João,</p>
            
            <p style="font-size: 16px; color: #666; margin-bottom: 30px;">
              Recebemos uma notificação de contestação (chargeback) referente ao seu pagamento. 
              Precisamos resolver isso urgentemente para manter seu acesso ativo.
            </p>
            
            <div style="background-color: #f8d7da; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h4 style="margin: 0 0 10px 0; color: #721c24;">O que é um chargeback?</h4>
              <p style="margin: 0; color: #721c24;">
                É quando o titular do cartão contesta uma compra junto ao banco. 
                Isso pode acontecer por engano ou fraude.
              </p>
            </div>
            
            <div style="background-color: #fff3cd; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h4 style="margin: 0 0 10px 0; color: #856404;">⏰ Ação necessária em 48 horas</h4>
              <p style="margin: 0 0 15px 0; color: #856404;">
                Para manter seu acesso, você precisa:
              </p>
              <ol style="margin: 0; padding-left: 20px; color: #856404;">
                <li>Confirmar que reconhece esta compra</li>
                <li>Entrar em contato com seu banco para cancelar a contestação</li>
                <li>Ou realizar um novo pagamento</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="#" style="display: inline-block; background-color: #dc3545; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
                Resolver Agora
              </a>
              
              <p style="margin-top: 20px; color: #666;">
                Precisa de ajuda? 
                <a href="#" style="color: #dc3545; text-decoration: underline; font-weight: bold;">
                  Fale com nosso suporte
                </a>
              </p>
            </div>
            
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #6c757d; font-size: 14px;">
                ⚠️ Após 48 horas sem resolução, seu acesso será temporariamente suspenso 
                até a regularização do pagamento.
              </p>
            </div>
          </div>
        </div>
      `
    },
    SALE_REFUNDED: {
      0: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">💰 Reembolso processado com sucesso</h1>
          </div>
          
          <div style="padding: 40px 20px; background-color: white;">
            <p style="font-size: 18px; color: #1a1a1a; margin-bottom: 20px;">Olá João,</p>
            
            <p style="font-size: 16px; color: #666; margin-bottom: 30px;">
              Confirmamos que seu reembolso foi processado com sucesso. 
              O valor será creditado em sua conta nos próximos dias úteis.
            </p>
            
            <div style="background-color: #e7f3ff; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h4 style="margin: 0 0 15px 0; color: #004085;">📋 Detalhes do reembolso:</h4>
              <div style="color: #004085;">
                <p style="margin: 0 0 10px 0;"><strong>Valor:</strong> R$ 497,00</p>
                <p style="margin: 0 0 10px 0;"><strong>Forma de pagamento:</strong> Cartão de Crédito</p>
                <p style="margin: 0;"><strong>Prazo:</strong> 5 a 10 dias úteis</p>
              </div>
            </div>
            
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h4 style="margin: 0 0 10px 0; color: #495057;">😔 Sentiremos sua falta!</h4>
              <p style="margin: 0; color: #666;">
                Gostaríamos de entender melhor o motivo da sua decisão. 
                Sua opinião é muito importante para melhorarmos nossos serviços.
              </p>
              
              <div style="text-align: center; margin-top: 20px;">
                <a href="#" style="display: inline-block; background-color: #6c757d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px;">
                  Compartilhar Feedback
                </a>
              </div>
            </div>
            
            <div style="background-color: #d4edda; border-radius: 8px; padding: 20px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #155724;">
                🎁 <strong>Oferta especial:</strong> Volte quando quiser com 30% de desconto!
              </p>
              <a href="#" style="color: #155724; text-decoration: underline; font-weight: bold;">
                Guardar cupom de desconto
              </a>
            </div>
          </div>
        </div>
      `
    },
    BANK_SLIP_GENERATED: {
      0: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #17a2b8; color: white; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">📄 Seu boleto está pronto!</h1>
          </div>
          
          <div style="padding: 40px 20px; background-color: white;">
            <p style="font-size: 18px; color: #1a1a1a; margin-bottom: 20px;">Olá João,</p>
            
            <p style="font-size: 16px; color: #666; margin-bottom: 30px;">
              Seu boleto foi gerado com sucesso! Pague até o vencimento e garanta seu acesso ao curso.
            </p>
            
            <div style="background-color: #d1ecf1; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
              <h3 style="margin: 0 0 15px 0; color: #0c5460;">Informações do boleto:</h3>
              <p style="margin: 0 0 10px 0; color: #0c5460;"><strong>Valor:</strong> R$ 497,00</p>
              <p style="margin: 0 0 20px 0; color: #0c5460;"><strong>Vencimento:</strong> 3 dias úteis</p>
              
              <a href="#" style="display: inline-block; background-color: #17a2b8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Baixar Boleto PDF
              </a>
            </div>
            
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h4 style="margin: 0 0 10px 0; color: #495057;">📱 Pague pelo app do seu banco:</h4>
              <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">
                Copie o código de barras abaixo:
              </p>
              <div style="background-color: #e9ecef; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 12px; word-break: break-all;">
                34191.79001 01043.510047 91020.150008 8 91230026000
              </div>
              <button style="margin-top: 10px; background-color: #6c757d; color: white; border: none; padding: 8px 20px; border-radius: 4px; cursor: pointer;">
                Copiar código
              </button>
            </div>
            
            <div style="background-color: #e8f5e9; border-radius: 8px; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #2e7d32;">
                💡 <strong>Dica:</strong> Prefere aprovação instantânea? 
                <a href="#" style="color: #2e7d32; text-decoration: underline; font-weight: bold;">
                  Pague com PIX agora
                </a>
              </p>
            </div>
          </div>
        </div>
      `,
      1: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 40px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">📅 Lembrete: Seu boleto vence em breve!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Não perca o prazo de pagamento</p>
          </div>
          
          <div style="padding: 40px 20px; background-color: white;">
            <p style="font-size: 18px; color: #1a1a1a; margin-bottom: 20px;">João, não esqueça!</p>
            
            <div style="background-color: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
              <h3 style="margin: 0 0 10px 0; color: #856404;">⏰ Seu boleto vence amanhã!</h3>
              <p style="margin: 0; color: #856404;">
                Pague hoje e evite a geração de um novo boleto
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="display: inline-block; background-color: #ffc107; color: #212529; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
                Pagar Boleto Agora
              </a>
              
              <p style="margin-top: 20px; color: #666;">
                ou copie o código de barras:
              </p>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 12px; word-break: break-all; margin: 10px auto; max-width: 400px;">
                34191.79001 01043.510047 91020.150008 8 91230026000
              </div>
            </div>
            
            <div style="background-color: #e3f2fd; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h4 style="margin: 0 0 10px 0; color: #1565c0;">💙 Quer mais prazo?</h4>
              <p style="margin: 0; color: #666;">
                Mude para PIX ou cartão e tenha aprovação instantânea!
              </p>
              <div style="margin-top: 15px;">
                <a href="#" style="color: #1565c0; text-decoration: underline; font-weight: bold; margin-right: 20px;">
                  Pagar com PIX
                </a>
                <a href="#" style="color: #1565c0; text-decoration: underline; font-weight: bold;">
                  Pagar com Cartão
                </a>
              </div>
            </div>
          </div>
        </div>
      `
    },
    PIX_GENERATED: {
      0: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 40px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">📱 PIX: Pague em segundos!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Aprovação instantânea garantida</p>
          </div>
          
          <div style="padding: 40px 20px; background-color: white;">
            <p style="font-size: 18px; color: #1a1a1a; margin-bottom: 20px;">Olá João, pagar com PIX é muito fácil!</p>
            
            <div style="background-color: #d4edda; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
              <h3 style="margin: 0 0 10px 0; color: #155724;">✅ Vantagens do PIX:</h3>
              <p style="margin: 0; color: #155724;">
                Aprovação em segundos • Sem taxas • Acesso imediato ao curso
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <h4 style="margin: 0 0 20px 0;">Escaneie o QR Code:</h4>
              <img src="https://via.placeholder.com/250x250" alt="QR Code PIX" style="border: 2px solid #38ef7d; border-radius: 8px; padding: 10px; background-color: white;">
              
              <p style="margin: 20px 0 10px 0; color: #666;">Ou copie o código PIX:</p>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 0 auto; max-width: 500px;">
                <code style="font-size: 12px; word-break: break-all; color: #495057;">
                  00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000
                </code>
              </div>
              
              <button style="margin-top: 10px; background-color: #38ef7d; color: white; border: none; padding: 10px 30px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                Copiar Código PIX
              </button>
            </div>
            
            <div style="background-color: #e8f5e9; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h4 style="margin: 0 0 15px 0; text-align: center;">📱 Como pagar:</h4>
              <ol style="margin: 0; padding-left: 20px; color: #666;">
                <li style="margin-bottom: 10px;">Abra o app do seu banco</li>
                <li style="margin-bottom: 10px;">Escolha pagar com PIX</li>
                <li style="margin-bottom: 10px;">Escaneie o QR Code ou cole o código</li>
                <li>Confirme o pagamento e pronto!</li>
              </ol>
            </div>
            
            <div style="background-color: #fff3cd; border-radius: 8px; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #856404;">
                ⏰ <strong>Atenção:</strong> Este PIX expira em 30 minutos. 
                Pague agora para garantir seu acesso!
              </p>
            </div>
          </div>
        </div>
      `
    },
    SUBSCRIPTION_CANCELED: {
      0: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ee5a24 0%, #f5576c 100%); color: white; padding: 40px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">😢 Sentiremos sua falta, João</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Sua assinatura foi cancelada</p>
          </div>
          
          <div style="padding: 40px 20px; background-color: white;">
            <p style="font-size: 18px; color: #1a1a1a; margin-bottom: 20px;">Confirmamos o cancelamento da sua assinatura.</p>
            
            <div style="background-color: #f8d7da; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h4 style="margin: 0 0 10px 0; color: #721c24;">📅 Importante:</h4>
              <p style="margin: 0; color: #721c24;">
                Você ainda tem acesso até o final do período já pago. 
                Aproveite para baixar seus materiais e certificados!
              </p>
            </div>
            
            <div style="background-color: #d1ecf1; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h4 style="margin: 0 0 10px 0; color: #0c5460;">💭 Podemos melhorar?</h4>
              <p style="margin: 0 0 15px 0; color: #0c5460;">
                Sua opinião é muito importante. Conte-nos o motivo do cancelamento:
              </p>
              <div style="text-align: center;">
                <a href="#" style="display: inline-block; background-color: #17a2b8; color: white; padding: 10px 25px; text-decoration: none; border-radius: 4px;">
                  Dar Feedback
                </a>
              </div>
            </div>
            
            <div style="background-color: #d4edda; border-radius: 8px; padding: 25px; text-align: center;">
              <h3 style="margin: 0 0 10px 0; color: #155724;">🎁 Oferta especial para você voltar:</h3>
              <p style="margin: 0 0 20px 0; color: #155724;">
                Reative sua assinatura nos próximos 7 dias e ganhe 20% de desconto!
              </p>
              <a href="#" style="display: inline-block; background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Reativar com Desconto
              </a>
            </div>
          </div>
        </div>
      `,
      1: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 50px 20px; text-align: center;">
            <div style="background-color: white; color: #764ba2; display: inline-block; padding: 10px 30px; border-radius: 30px; margin-bottom: 20px;">
              <span style="font-size: 18px; font-weight: bold;">🎁 OFERTA EXCLUSIVA</span>
            </div>
            <h1 style="margin: 0; font-size: 32px;">Volte com 30% de desconto!</h1>
            <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.9;">Válido apenas esta semana</p>
          </div>
          
          <div style="padding: 40px 20px; background-color: white;">
            <p style="font-size: 18px; color: #1a1a1a; margin-bottom: 20px;">João, temos novidades incríveis para você!</p>
            
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
              <h3 style="margin: 0 0 15px 0; text-align: center;">🚀 O que mudou desde que você saiu:</h3>
              
              <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #dee2e6;">
                <h4 style="margin: 0 0 5px 0; color: #495057;">✨ Novos módulos adicionados</h4>
                <p style="margin: 0; color: #666; font-size: 14px;">
                  +10 aulas sobre as últimas tendências do mercado
                </p>
              </div>
              
              <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #dee2e6;">
                <h4 style="margin: 0 0 5px 0; color: #495057;">🎯 Mentoria ao vivo semanal</h4>
                <p style="margin: 0; color: #666; font-size: 14px;">
                  Tire dúvidas diretamente com os instrutores
                </p>
              </div>
              
              <div>
                <h4 style="margin: 0 0 5px 0; color: #495057;">📱 Novo app mobile</h4>
                <p style="margin: 0; color: #666; font-size: 14px;">
                  Estude de qualquer lugar, mesmo offline
                </p>
              </div>
            </div>
            
            <div style="background-color: #e7f3ff; border: 2px solid #0084ff; border-radius: 8px; padding: 25px; margin-bottom: 30px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 24px; font-weight: bold; color: #0084ff;">
                De <span style="text-decoration: line-through;">R$ 97,00</span> por:
              </p>
              <p style="margin: 0; font-size: 48px; font-weight: bold; color: #27ae60;">
                R$ 67,90
              </p>
              <p style="margin: 10px 0 0 0; color: #666;">
                por mês (economia de R$ 29,10)
              </p>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px 60px; text-decoration: none; border-radius: 8px; font-size: 20px; font-weight: bold; box-shadow: 0 4px 20px rgba(118, 75, 162, 0.3);">
                Voltar com 30% OFF
              </a>
            </div>
          </div>
        </div>
      `,
      2: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 50px 20px; text-align: center;">
            <div style="background-color: white; color: #f5576c; display: inline-block; padding: 10px 30px; border-radius: 30px; margin-bottom: 20px;">
              <span style="font-size: 18px; font-weight: bold;">🎁 ÚLTIMA CHANCE</span>
            </div>
            <h1 style="margin: 0; font-size: 32px;">João, esta oferta expira hoje!</h1>
            <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.9;">30% de desconto + bônus exclusivos</p>
          </div>
          
          <div style="padding: 40px 20px; background-color: white;">
            <div style="background-color: #fee; border: 2px solid #f5576c; border-radius: 8px; padding: 25px; margin-bottom: 30px; text-align: center;">
              <h3 style="margin: 0 0 15px 0; color: #f5576c;">🎁 Volte agora e ganhe:</h3>
              <ul style="margin: 0; padding: 0; list-style: none; color: #666;">
                <li style="margin-bottom: 10px;">✅ 30% de desconto vitalício</li>
                <li style="margin-bottom: 10px;">✅ Acesso ao grupo VIP de ex-alunos</li>
                <li style="margin-bottom: 10px;">✅ 3 mentorias individuais de 30min</li>
                <li>✅ Certificado de conclusão premium</li>
              </ul>
            </div>
            
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h4 style="margin: 0 0 15px 0;">O que nossos alunos conquistaram este mês:</h4>
              
              <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
                <p style="margin: 0 0 5px 0; font-weight: bold;">Maria Silva</p>
                <p style="margin: 0; color: #666; font-style: italic;">
                  "Fechei 3 clientes novos aplicando as estratégias do curso!"
                </p>
              </div>
              
              <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
                <p style="margin: 0 0 5px 0; font-weight: bold;">Carlos Santos</p>
                <p style="margin: 0; color: #666; font-style: italic;">
                  "Meu faturamento aumentou 40% em apenas 2 meses"
                </p>
              </div>
              
              <div>
                <p style="margin: 0 0 5px 0; font-weight: bold;">Ana Costa</p>
                <p style="margin: 0; color: #666; font-style: italic;">
                  "Finalmente entendi como fazer anúncios que convertem!"
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px 60px; text-decoration: none; border-radius: 8px; font-size: 20px; font-weight: bold; box-shadow: 0 4px 20px rgba(245, 87, 108, 0.3);">
                Reativar com 30% OFF
              </a>
              
              <div style="margin-top: 20px;">
                <p style="color: #f5576c; font-weight: bold;">
                  ⏰ Oferta expira em:
                </p>
                <p style="font-size: 24px; font-weight: bold; color: #333;">
                  23:59:59
                </p>
              </div>
            </div>
            
            <div style="background-color: #fff3cd; border-radius: 8px; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #856404;">
                ⚠️ <strong>Aviso:</strong> Após esta oferta expirar, você precisará 
                pagar o valor integral para voltar a ser assinante.
              </p>
            </div>
          </div>
        </div>
      `
    },
    SUBSCRIPTION_EXPIRED: {
      0: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ffa726 0%, #fb8c00 100%); color: white; padding: 40px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">⏳ Sua assinatura expira em 3 dias</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Renove agora e não perca o acesso</p>
          </div>
          
          <div style="padding: 40px 20px; background-color: white;">
            <p style="font-size: 18px; color: #1a1a1a; margin-bottom: 20px;">Olá João,</p>
            
            <p style="font-size: 16px; color: #666; margin-bottom: 30px;">
              Sua assinatura está prestes a expirar. Renove agora para continuar 
              tendo acesso a todo o conteúdo e novidades que preparamos para você!
            </p>
            
            <div style="background-color: #fff3cd; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h4 style="margin: 0 0 10px 0; color: #856404;">📅 Data de expiração:</h4>
              <p style="margin: 0; color: #856404; font-size: 20px; font-weight: bold;">
                30 de Maio de 2025
              </p>
            </div>
            
            <div style="background-color: #d4edda; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h4 style="margin: 0 0 15px 0; color: #155724;">✅ Ao renovar agora você garante:</h4>
              <ul style="margin: 0; padding-left: 20px; color: #155724;">
                <li style="margin-bottom: 8px;">Acesso contínuo sem interrupção</li>
                <li style="margin-bottom: 8px;">Todos os novos conteúdos do próximo mês</li>
                <li style="margin-bottom: 8px;">Participação nas mentorias ao vivo</li>
                <li>Manutenção do seu progresso e certificados</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #ffa726 0%, #fb8c00 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 15px rgba(251, 140, 0, 0.3);">
                Renovar Assinatura
              </a>
              
              <p style="margin-top: 20px; color: #666;">
                Prefere mudar de plano? 
                <a href="#" style="color: #fb8c00; text-decoration: underline;">
                  Ver outras opções
                </a>
              </p>
            </div>
            
            <div style="background-color: #e3f2fd; border-radius: 8px; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #1565c0;">
                💡 <strong>Dica:</strong> Mude para o plano anual e economize 20%!
              </p>
            </div>
          </div>
        </div>
      `,
      1: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 50px 20px; text-align: center;">
            <div style="background-color: white; color: #f5576c; display: inline-block; padding: 10px 30px; border-radius: 30px; margin-bottom: 20px;">
              <span style="font-size: 18px; font-weight: bold;">🔄 OFERTA DE RENOVAÇÃO</span>
            </div>
            <h1 style="margin: 0; font-size: 32px;">Renove com 20% de desconto!</h1>
            <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.9;">Exclusivo para você</p>
          </div>
          
          <div style="padding: 40px 20px; background-color: white;">
            <p style="font-size: 18px; color: #1a1a1a; margin-bottom: 20px;">João, sua assinatura expirou ontem.</p>
            
            <p style="font-size: 16px; color: #666; margin-bottom: 30px;">
              Mas temos uma ótima notícia! Como você é um aluno especial, 
              preparamos uma oferta exclusiva para sua renovação.
            </p>
            
            <div style="background-color: #fee; border: 2px solid #f5576c; border-radius: 8px; padding: 25px; margin-bottom: 30px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 24px; font-weight: bold; color: #f5576c;">
                De <span style="text-decoration: line-through;">R$ 97,00</span> por:
              </p>
              <p style="margin: 0; font-size: 48px; font-weight: bold; color: #27ae60;">
                R$ 77,60
              </p>
              <p style="margin: 10px 0 0 0; color: #666;">
                por mês (economia de R$ 19,40)
              </p>
            </div>
            
            <div style="background-color: #f8d7da; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h4 style="margin: 0 0 10px 0; color: #721c24;">⚠️ Atenção:</h4>
              <p style="margin: 0; color: #721c24;">
                Seu acesso foi temporariamente suspenso. Renove agora para 
                recuperar todo seu progresso e continuar de onde parou!
              </p>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px 60px; text-decoration: none; border-radius: 8px; font-size: 20px; font-weight: bold; box-shadow: 0 4px 20px rgba(245, 87, 108, 0.3);">
                Renovar com 20% OFF
              </a>
              
              <p style="margin-top: 20px; color: #666;">
                Esta oferta é válida por tempo limitado
              </p>
            </div>
            
            <div style="background-color: #d1ecf1; border-radius: 8px; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #0c5460;">
                💙 Mais de 500 alunos renovaram este mês e estão 
                alcançando resultados incríveis!
              </p>
            </div>
          </div>
        </div>
      `
    },
    SUBSCRIPTION_RENEWED: {
      0: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 50px 20px; text-align: center;">
            <div style="background-color: white; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 40px;">🎉</span>
            </div>
            <h1 style="margin: 0; font-size: 32px;">Obrigado por renovar, João!</h1>
            <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.9;">Sua jornada de aprendizado continua!</p>
          </div>
          
          <div style="padding: 40px 20px; background-color: white;">
            <div style="background-color: #d4edda; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
              <h3 style="margin: 0 0 10px 0; color: #155724;">✅ Renovação confirmada!</h3>
              <p style="margin: 0; color: #155724;">
                Sua assinatura foi renovada com sucesso para mais 30 dias.
              </p>
            </div>
            
            <div style="background-color: #e7f3ff; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
              <h4 style="margin: 0 0 15px 0; text-align: center;">🎁 Benefícios exclusivos este mês:</h4>
              
              <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #cce5ff;">
                <h5 style="margin: 0 0 5px 0; color: #004085;">📚 Novo módulo bônus</h5>
                <p style="margin: 0; color: #666; font-size: 14px;">
                  "Estratégias avançadas de conversão" já disponível!
                </p>
              </div>
              
              <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #cce5ff;">
                <h5 style="margin: 0 0 5px 0; color: #004085;">🎯 Mentoria exclusiva</h5>
                <p style="margin: 0; color: #666; font-size: 14px;">
                  Agende sua sessão individual de 30 minutos
                </p>
              </div>
              
              <div>
                <h5 style="margin: 0 0 5px 0; color: #004085;">🏆 Desafio do mês</h5>
                <p style="margin: 0; color: #666; font-size: 14px;">
                  Participe e concorra a prêmios exclusivos!
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 20px rgba(56, 239, 125, 0.3);">
                Acessar Novo Conteúdo
              </a>
            </div>
            
            <div style="background-color: #fff3cd; border-radius: 8px; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #856404;">
                💡 <strong>Dica do mês:</strong> Complete o novo módulo em 7 dias 
                e desbloqueie um certificado especial!
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                Próxima renovação: 30 de Junho de 2025
              </p>
            </div>
          </div>
        </div>
      `
    }
  };

  const eventTemplates = templates[eventType];
  if (!eventTemplates) return null;
  
  return eventTemplates[attemptIndex] || eventTemplates[0];
};

// Mock de preview de email
const EmailPreview = ({ template, eventType, attemptIndex }: { template: any, eventType: string, attemptIndex: number }) => {
  const emailHtml = getEmailTemplate(eventType, attemptIndex);
  
  if (!emailHtml) {
    return (
      <div className="relative overflow-hidden rounded-lg border bg-white shadow-sm p-8 text-center">
        <p className="text-gray-500">Template em desenvolvimento...</p>
      </div>
    );
  }
  
  return (
    <div className="relative overflow-hidden rounded-lg border bg-white shadow-sm">
      {/* Email Header */}
      <div className="border-b bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600" />
            <div>
              <h3 style={{ margin: '0 0 5px 0', color: '#1a1a1a' }}>Curso de Marketing Digital Avançado</h3>
              <p style={{ margin: 0, fontSize: '18px', color: '#e74c3c', fontWeight: 'bold' }}>R$ 497,00</p>
              <p style={{ margin: '5px 0 0 0', color: '#999', fontSize: '14px' }}>Quantidade: 1</p>
            </div>
          </div>
        </div>
      </div>

      {/* Email Content */}
      <div className="bg-gray-100 p-4">
        <div 
          className="mx-auto"
          dangerouslySetInnerHTML={{ __html: emailHtml }}
          style={{ maxWidth: '600px' }}
        />
      </div>
    </div>
  );
};

export default function TemplatesPage() {
  const [selectedEvent, setSelectedEvent] = useState("ABANDONED_CART");
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  
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

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg transition-all hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Personalização</CardTitle>
                <div className="rounded-lg bg-green-500/10 p-2">
                  <Sparkles className="h-4 w-4 text-green-600" />
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
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2 p-2">
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
                                  {event.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
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
                    <Button 
                      variant={viewMode === "mobile" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setViewMode("mobile")}
                    >
                      <Smartphone className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant={viewMode === "desktop" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setViewMode("desktop")}
                    >
                      <Monitor className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className={cn(
                  "mx-auto transition-all",
                  viewMode === "mobile" ? "max-w-[375px]" : "max-w-full"
                )}>
                  <EmailPreview 
                    template={strategies[selectedTemplate]} 
                    eventType={selectedEvent}
                    attemptIndex={selectedTemplate}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 