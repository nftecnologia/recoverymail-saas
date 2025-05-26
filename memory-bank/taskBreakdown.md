# Breakdown de Tarefas - Recovery SaaS

## 🎯 Sprint Atual: Backend Core (Semana 1-2)

### TAREFA 1: Setup Inicial do Projeto [0% completo]
**Objetivo**: Configurar ambiente de desenvolvimento completo

#### 🔴 Subtarefas Pendentes:
- [ ] Inicializar projeto Node.js + TypeScript
  ```bash
  npm init -y
  npm install typescript @types/node tsx
  npx tsc --init
  ```
- [ ] Configurar estrutura de pastas
  ```
  backend/
  ├── src/
  │   ├── server.ts
  │   ├── config/
  │   ├── routes/
  │   ├── handlers/
  │   ├── workers/
  │   ├── services/
  │   ├── utils/
  │   └── types/
  ├── prisma/
  ├── tests/
  └── docker/
  ```
- [ ] Setup ESLint + Prettier
- [ ] Configurar Docker Compose
  - [ ] PostgreSQL (Neon local dev)
  - [ ] Redis
  - [ ] n8n
  - [ ] Mailhog (dev emails)
- [ ] Configurar variáveis de ambiente
  ```env
  DATABASE_URL=
  REDIS_URL=
  N8N_URL=
  RESEND_API_KEY=
  JWT_SECRET=
  ```
- [ ] Setup Prisma com schema inicial
- [ ] Criar scripts npm essenciais

**Estimativa**: 4 horas  
**Bloqueadores**: Nenhum

---

### TAREFA 2: Sistema Base de Webhooks [0% completo]
**Objetivo**: Receber, validar e armazenar webhooks

#### 🔴 Subtarefas Pendentes:
- [ ] Setup Express + middleware básico
  ```typescript
  // Middleware essencial
  app.use(express.json({ limit: '10mb' }))
  app.use(helmet())
  app.use(cors())
  app.use(compression())
  ```
- [ ] Criar endpoint POST /webhook/:orgId
- [ ] Implementar validação HMAC
  ```typescript
  // validateSignature.middleware.ts
  const signature = req.headers['x-webhook-signature']
  const payload = JSON.stringify(req.body)
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  ```
- [ ] Validação com Zod schemas
- [ ] Rate limiting com Redis
  - [ ] 100 req/min por organização
  - [ ] 1000 req/min global
- [ ] Salvar eventos no PostgreSQL
- [ ] Publicar evento no Redis (pub/sub)
- [ ] Tratamento de erros padronizado
- [ ] Logs estruturados (Winston)
- [ ] Testes unitários

**Estimativa**: 8 horas  
**Bloqueadores**: Setup inicial completo

---

### TAREFA 3: Sistema de Filas com Bull [0% completo]
**Objetivo**: Processar webhooks de forma assíncrona

#### 🔴 Subtarefas Pendentes:
- [ ] Configurar Bull Queue
  ```typescript
  const emailQueue = new Bull('email-queue', {
    redis: { host: 'localhost', port: 6379 }
  })
  ```
- [ ] Criar estrutura de workers
  - [ ] email.worker.ts (principal)
  - [ ] retry.worker.ts
  - [ ] cleanup.worker.ts
- [ ] Implementar delays por tipo de evento
  ```typescript
  const delays = {
    ABANDONED_CART: [2*60, 24*60, 72*60], // minutos
    BANK_SLIP_EXPIRED: [0, 6*60, 24*60],
    PIX_EXPIRED: [15, 120]
  }
  ```
- [ ] Dead letter queue para falhas
- [ ] Bull Board para monitoramento
- [ ] Métricas com Prometheus
- [ ] Graceful shutdown
- [ ] Testes de carga

**Estimativa**: 6 horas  
**Bloqueadores**: Redis configurado

---

### TAREFA 4: Integração n8n [0% completo]
**Objetivo**: Criar workflows visuais para automação

#### 🔴 Subtarefas Pendentes:
- [ ] Configurar n8n no Docker
  ```yaml
  n8n:
    image: n8nio/n8n
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_WEBHOOK_URL=http://localhost:5678/
  ```
- [ ] Criar webhook receiver genérico
- [ ] Conectar n8n ao PostgreSQL
- [ ] Conectar n8n ao Redis
- [ ] Criar workflow template base
- [ ] Implementar nodes customizados
  - [ ] Recovery webhook parser
  - [ ] Email delay calculator
  - [ ] Template selector
- [ ] Documentar workflows
- [ ] Backup/restore de workflows

**Estimativa**: 8 horas  
**Bloqueadores**: Docker rodando

---

### TAREFA 5: Integração Resend + Templates [0% completo]
**Objetivo**: Enviar emails transacionais bonitos

#### 🔴 Subtarefas Pendentes:
- [ ] Configurar Resend SDK
- [ ] Criar serviço de email
  ```typescript
  class EmailService {
    async send(to: string, template: string, data: any)
    async sendBatch(emails: Email[])
    async trackOpen(emailId: string)
  }
  ```
- [ ] Setup React Email
- [ ] Criar templates base
  - [ ] Layout principal
  - [ ] Header/Footer
  - [ ] Componentes reutilizáveis
- [ ] Sistema de templates dinâmicos
- [ ] Tracking de abertura/cliques
- [ ] Bounce handling
- [ ] Unsubscribe automático

**Estimativa**: 10 horas  
**Bloqueadores**: Conta Resend criada

---

## 📋 Checklist Diário

### Dia 1 (Segunda)
- [ ] Setup inicial completo
- [ ] Docker Compose rodando
- [ ] Estrutura de pastas criada
- [ ] Prisma configurado

### Dia 2 (Terça)
- [ ] Webhook endpoint funcionando
- [ ] Validação HMAC implementada
- [ ] Salvamento no banco OK
- [ ] Testes básicos passando

### Dia 3 (Quarta)
- [ ] Bull Queue configurado
- [ ] Worker básico processando
- [ ] n8n conectado
- [ ] Primeiro workflow criado

### Dia 4 (Quinta)
- [ ] Resend integrado
- [ ] Primeiro email enviado
- [ ] Templates React Email
- [ ] ABANDONED_CART completo

### Dia 5 (Sexta)
- [ ] BANK_SLIP_EXPIRED completo
- [ ] Rate limiting funcionando
- [ ] Monitoramento básico
- [ ] Deploy no Railway

---

## 🚀 Próximas Sprints

### Sprint 2: Dashboard MVP (Semana 3-4)
- [ ] Setup Next.js 14 + App Router
- [ ] Autenticação com Clerk/Auth.js
- [ ] Tela de eventos (lista/filtros)
- [ ] Métricas básicas (cards)
- [ ] Configurações de webhooks
- [ ] Templates customizáveis

### Sprint 3: Multi-tenancy (Semana 5-6)
- [ ] Isolamento de dados por tenant
- [ ] Onboarding flow
- [ ] Billing com Stripe
- [ ] Limites por plano
- [ ] Admin panel
- [ ] API keys por organização

### Sprint 4: IA & Otimizações (Semana 7-8)
- [ ] Integração OpenAI/Claude
- [ ] Personalização de conteúdo
- [ ] A/B testing automático
- [ ] Análise preditiva
- [ ] Otimização de timing
- [ ] Sugestões de templates

---

## 📝 Notas de Desenvolvimento

### Padrões de Código
```typescript
// Sempre usar tipos explícitos
interface WebhookPayload {
  event: EventType;
  timestamp: string;
  organization_id: string;
  data: Record<string, any>;
}

// Tratamento de erro consistente
class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
  }
}

// Logs estruturados
logger.info('Webhook received', {
  event: payload.event,
  orgId: payload.organization_id,
  timestamp: new Date().toISOString()
});
```

### Decisões Técnicas
1. **Por que Bull?** Melhor que Bee para jobs complexos com delays
2. **Por que n8n?** Flexibilidade para clientes customizarem flows
3. **Por que Neon?** Branching de DB para testes isolados
4. **Por que Resend?** Melhor DX e preço que SendGrid

### Métricas de Sucesso
- [ ] < 100ms latência no webhook
- [ ] 0 webhooks perdidos
- [ ] 95%+ taxa de entrega de email
- [ ] < 1% de erros em produção

---

## 🐛 Bugs Conhecidos
- Nenhum ainda (projeto novo)

## 🔗 Links Úteis
- [Documentação Neon](https://neon.tech/docs)
- [n8n Docs](https://docs.n8n.io)
- [Bull Queue](https://github.com/OptimalBits/bull)
- [Resend Docs](https://resend.com/docs)
- [React Email](https://react.email) 