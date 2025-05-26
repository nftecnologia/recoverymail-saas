# Inbox Recovery - Project Brief

## 🎯 Visão do Projeto
Criar um SaaS multi-tenant para recuperação automática de vendas perdidas através de campanhas de email inteligentes, processando webhooks de plataformas de e-commerce e automatizando o envio de emails de recuperação com timing otimizado.

## 🔥 Problema Resolvido
- **70% dos carrinhos** são abandonados no e-commerce brasileiro
- **Boletos expiram** e vendas são perdidas por falta de follow-up
- **Processos manuais** de recuperação são ineficientes e caros
- **Falta de personalização** nos emails de recuperação
- **Timing inadequado** reduz taxa de conversão

## 📋 Requisitos Core

### Funcionais
- [ ] Receber e processar 12 tipos diferentes de webhooks
- [ ] Sistema de filas com delays customizados por evento
- [ ] Templates de email responsivos e personalizáveis
- [ ] Geração de conteúdo com IA para otimizar conversão
- [ ] Dashboard com métricas em tempo real
- [ ] Multi-tenancy com isolamento completo de dados
- [ ] API REST para integração com sistemas externos
- [ ] Sistema de tags e segmentação de clientes
- [ ] A/B testing para otimização de campanhas
- [ ] Webhooks de saída para notificações

### Não-Funcionais
- [ ] Processar 1000 webhooks/segundo
- [ ] Taxa de entrega de email > 95%
- [ ] Uptime 99.9%
- [ ] Conformidade com LGPD
- [ ] Escalabilidade horizontal
- [ ] Latência < 100ms para API
- [ ] Backup automático diário
- [ ] Logs estruturados e auditoria completa

## 🛠 Stack Técnica Definida

### Backend Core
- **Runtime**: Node.js 20 LTS + TypeScript 5.3
- **Framework**: Express.js com middleware customizado
- **Validação**: Zod para type-safety
- **ORM**: Prisma com migrations automáticas

### Automação & Workflows
- **n8n**: Workflows visuais para automação complexa
  - Versão self-hosted para controle total
  - Integração com webhooks e filas
  - Nodes customizados para Recovery SaaS
  - Backup de workflows versionado

### Banco de Dados
- **PostgreSQL (Neon)**: 
  - Banco principal com branching
  - Connection pooling automático
  - Backups point-in-time
  - SSL obrigatório
- **Redis**: 
  - Cache de sessões e rate limiting
  - Filas com Bull Queue
  - Pub/Sub para eventos real-time

### Comunicação
- **Email**: Resend API
  - Templates com React Email
  - Tracking de abertura/cliques
  - Bounce handling automático
- **SMS**: Twilio (futuro)
- **WhatsApp**: API Business (futuro)

### Frontend
- **Framework**: Next.js 14 com App Router
- **UI**: Shadcn/ui + Tailwind CSS
- **Estado**: TanStack Query + Zustand
- **Gráficos**: Recharts
- **Forms**: React Hook Form + Zod

### Infraestrutura
- **Hospedagem**: 
  - Vercel (Frontend)
  - Railway (Backend + n8n)
  - Neon (PostgreSQL)
  - Upstash (Redis)
- **CDN**: Cloudflare
- **Monitoramento**: 
  - Sentry (erros)
  - Prometheus + Grafana (métricas)
  - Betterstack (uptime)

### IA & Machine Learning
- **LLM**: OpenAI GPT-4 / Claude 3
- **Embeddings**: OpenAI Ada
- **Vector DB**: Pinecone (futuro)

## 📊 Critérios de Sucesso
- Aumentar taxa de recuperação em **30%** vs. email manual
- ROI positivo em **3 meses**
- Reduzir tempo de setup para **< 10 minutos**
- NPS > 8 dos usuários
- Churn rate < 5% mensal
- 100+ clientes ativos em 6 meses

## 🚀 Marcos do Projeto

### Fase 1: MVP (4 semanas) 
- [x] Setup inicial do projeto
- [ ] Sistema de webhooks com validação
- [ ] 3 tipos de eventos principais (ABANDONED_CART, BANK_SLIP_EXPIRED, PIX_EXPIRED)
- [ ] Templates de email básicos
- [ ] Integração n8n + Redis
- [ ] Deploy inicial

### Fase 2: Beta (8 semanas)
- [ ] Todos 12 tipos de webhooks
- [ ] Dashboard com métricas básicas
- [ ] Sistema de templates customizáveis
- [ ] Integração com IA para personalização
- [ ] Multi-tenancy básico
- [ ] 10 beta testers ativos

### Fase 3: v1.0 (12 semanas)
- [ ] Multi-tenancy completo com billing
- [ ] API pública documentada
- [ ] A/B testing
- [ ] Onboarding automatizado
- [ ] Marketplace de templates
- [ ] 50 clientes pagantes

### Fase 4: Escala (6 meses)
- [ ] Integrações com principais plataformas
- [ ] SDK para desenvolvedores
- [ ] White-label
- [ ] Expansão internacional

## 💰 Modelo de Negócio
- **Starter**: R$ 97/mês - até 1k emails
- **Growth**: R$ 297/mês - até 10k emails  
- **Scale**: R$ 797/mês - até 50k emails
- **Enterprise**: Customizado

## 🎯 Diferenciais Competitivos
1. **Setup em minutos** vs. horas da concorrência
2. **IA integrada** para personalização automática
3. **Workflows visuais** com n8n (único no mercado)
4. **Multi-canal** pronto para WhatsApp/SMS
5. **Preço acessível** para PMEs brasileiras

## 📈 KPIs Principais
- **MRR** (Monthly Recurring Revenue)
- **Taxa de Recuperação** por tipo de evento
- **Tempo Médio de Setup**
- **Uptime do Sistema**
- **NPS dos Clientes**
- **CAC** (Customer Acquisition Cost)
- **LTV** (Lifetime Value)

## 🔒 Segurança & Compliance
- Criptografia em trânsito e repouso
- Autenticação JWT com refresh tokens
- Rate limiting por tenant
- Logs de auditoria completos
- Conformidade LGPD/GDPR
- Backup automático 3x ao dia
- Disaster recovery plan 