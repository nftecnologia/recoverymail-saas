# Base de Conhecimento - Recovery SaaS

## 🧠 Soluções Implementadas

### 1. Webhook Processing com Idempotência
**Problema**: Webhooks podem ser enviados múltiplas vezes  
**Solução**: Implementar idempotência usando hash único

```typescript
// Gerar hash único para cada webhook
const generateWebhookHash = (payload: WebhookPayload): string => {
  const content = `${payload.event}-${payload.organization_id}-${payload.data.checkout_id || payload.data.order_id}-${payload.timestamp}`;
  return crypto.createHash('sha256').update(content).digest('hex');
};

// Verificar duplicação antes de processar
const isDuplicate = await prisma.webhookEvent.findUnique({
  where: { hash: webhookHash }
});

if (isDuplicate) {
  logger.info('Duplicate webhook detected', { hash: webhookHash });
  return res.status(200).json({ status: 'already_processed' });
}
```

### 2. Rate Limiting com Redis
**Problema**: Proteger contra spam e abuse  
**Solução**: Rate limiter customizado por organização

```typescript
import { RateLimiterRedis } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'webhook_limit',
  points: 100, // requests
  duration: 60, // per minute
  blockDuration: 60 * 5, // block for 5 minutes
});

// Middleware
export const webhookRateLimiter = async (req, res, next) => {
  try {
    const key = `${req.params.orgId}:${req.ip}`;
    await rateLimiter.consume(key);
    next();
  } catch (rejRes) {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000) || 60
    });
  }
};
```

### 3. n8n Custom Nodes
**Problema**: n8n não tem nodes específicos para Recovery  
**Solução**: Criar nodes customizados

```javascript
// recovery-webhook-trigger.node.js
module.exports = {
  description: {
    displayName: 'Recovery Webhook Trigger',
    name: 'recoveryWebhookTrigger',
    group: ['trigger'],
    version: 1,
    description: 'Triggers workflow on Recovery SaaS webhook',
    defaults: {
      name: 'Recovery Webhook',
    },
    inputs: [],
    outputs: ['main'],
    webhooks: [
      {
        name: 'default',
        httpMethod: 'POST',
        responseMode: 'onReceived',
        path: 'recovery-webhook',
      },
    ],
    properties: [
      {
        displayName: 'Event Types',
        name: 'eventTypes',
        type: 'multiOptions',
        options: [
          { name: 'Abandoned Cart', value: 'ABANDONED_CART' },
          { name: 'Bank Slip Expired', value: 'BANK_SLIP_EXPIRED' },
          // ... outros eventos
        ],
        default: ['ABANDONED_CART'],
      },
    ],
  },
  
  async webhook(this) {
    const bodyData = this.getBodyData();
    const eventType = bodyData.event;
    const allowedEvents = this.getNodeParameter('eventTypes', 0);
    
    if (!allowedEvents.includes(eventType)) {
      return {};
    }
    
    return {
      workflowData: [
        [
          {
            json: bodyData,
            headers: this.getHeaderData(),
          },
        ],
      ],
    };
  },
};
```

### 4. Email Templates com React Email
**Problema**: Templates de email difíceis de manter  
**Solução**: React Email para componentes reutilizáveis

```tsx
// components/email-layout.tsx
import { Html, Head, Body, Container, Section } from '@react-email/components';

export const EmailLayout = ({ children, preview }) => (
  <Html>
    <Head>
      <style>{`
        @font-face {
          font-family: 'Inter';
          src: url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        }
      `}</style>
    </Head>
    <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'Inter, sans-serif' }}>
      <Container style={{ margin: '0 auto', padding: '20px 0 48px' }}>
        {preview && <div style={{ display: 'none' }}>{preview}</div>}
        {children}
      </Container>
    </Body>
  </Html>
);

// templates/abandoned-cart.tsx
export const AbandonedCartEmail = ({ customer, products, checkoutUrl }) => (
  <EmailLayout preview="Você esqueceu alguns itens no seu carrinho">
    <Section style={{ backgroundColor: 'white', borderRadius: '8px', padding: '32px' }}>
      <h1>Olá {customer.name}! 👋</h1>
      <p>Notamos que você deixou alguns itens incríveis no seu carrinho:</p>
      
      {products.map(product => (
        <div key={product.id} style={{ display: 'flex', marginBottom: '16px' }}>
          <img src={product.image_url} width={80} height={80} />
          <div style={{ marginLeft: '16px' }}>
            <h3>{product.name}</h3>
            <p>{product.price}</p>
          </div>
        </div>
      ))}
      
      <Button href={checkoutUrl}>
        Finalizar Compra
      </Button>
    </Section>
  </EmailLayout>
);
```

### 5. Bull Queue com Retry Strategy
**Problema**: Emails falhando por problemas temporários  
**Solução**: Retry inteligente com backoff exponencial

```typescript
const emailQueue = new Bull('email-queue', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000, // 2s, 4s, 8s, 16s, 32s
    },
    removeOnComplete: {
      age: 24 * 3600, // 24 hours
      count: 100, // keep last 100
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // 7 days
    },
  },
});

// Processar com tratamento de erro específico
emailQueue.process(async (job) => {
  const { eventId, emailNumber } = job.data;
  
  try {
    await sendEmail(eventId, emailNumber);
  } catch (error) {
    // Erro temporário - retry
    if (error.code === 'RATE_LIMIT' || error.code === 'TIMEOUT') {
      throw error; // Bull vai fazer retry
    }
    
    // Erro permanente - não fazer retry
    if (error.code === 'INVALID_EMAIL' || error.code === 'UNSUBSCRIBED') {
      await job.discard();
      await job.log(`Permanent error: ${error.message}`);
      return;
    }
    
    throw error;
  }
});
```

### 6. Prisma com Soft Deletes
**Problema**: Dados deletados acidentalmente  
**Solução**: Implementar soft deletes global

```prisma
// schema.prisma
model WebhookEvent {
  id              String    @id @default(cuid())
  event           String
  organizationId  String    @map("organization_id")
  data            Json
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  deletedAt       DateTime? @map("deleted_at")
  
  @@index([organizationId, event])
  @@index([deletedAt])
  @@map("webhook_events")
}

// Middleware global para soft deletes
prisma.$use(async (params, next) => {
  // Filtrar deletados em finds
  if (params.action === 'findUnique' || params.action === 'findFirst' || params.action === 'findMany') {
    if (!params.args.where.deletedAt) {
      params.args.where.deletedAt = null;
    }
  }
  
  // Converter delete em update
  if (params.action === 'delete') {
    params.action = 'update';
    params.args.data = { deletedAt: new Date() };
  }
  
  if (params.action === 'deleteMany') {
    params.action = 'updateMany';
    params.args.data = { deletedAt: new Date() };
  }
  
  return next(params);
});
```

### 7. Webhook Signature com Timestamp
**Problema**: Replay attacks em webhooks  
**Solução**: Incluir timestamp na assinatura

```typescript
// Gerar assinatura com timestamp
export const generateWebhookSignature = (
  payload: any,
  secret: string,
  timestamp: number = Date.now()
): { signature: string; timestamp: number } => {
  const message = `${timestamp}.${JSON.stringify(payload)}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');
  
  return { signature, timestamp };
};

// Validar com window de 5 minutos
export const validateWebhookSignature = (
  payload: any,
  signature: string,
  timestamp: string,
  secret: string
): boolean => {
  // Verificar idade do webhook
  const currentTime = Date.now();
  const webhookTime = parseInt(timestamp);
  const fiveMinutes = 5 * 60 * 1000;
  
  if (currentTime - webhookTime > fiveMinutes) {
    throw new Error('Webhook timestamp too old');
  }
  
  // Verificar assinatura
  const expectedSignature = generateWebhookSignature(
    payload,
    secret,
    webhookTime
  ).signature;
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};
```

## 🔥 Problemas Comuns e Soluções

### 1. Neon Connection Issues
**Problema**: "SSL connection required"  
**Solução**: 
```typescript
// Sempre usar SSL em produção
const databaseUrl = process.env.NODE_ENV === 'production'
  ? `${process.env.DATABASE_URL}?sslmode=require`
  : process.env.DATABASE_URL;
```

### 2. Redis Memory Issues
**Problema**: Redis consumindo muita memória  
**Solução**:
```typescript
// Configurar políticas de eviction
const redis = new Redis({
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  maxmemory: '256mb',
  maxmemoryPolicy: 'allkeys-lru',
});

// Limpar jobs antigos
const cleanupOldJobs = async () => {
  const jobs = await emailQueue.getJobs(['completed', 'failed']);
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  
  for (const job of jobs) {
    if (job.timestamp < oneWeekAgo) {
      await job.remove();
    }
  }
};

// Rodar diariamente
cron.schedule('0 3 * * *', cleanupOldJobs);
```

### 3. n8n Workflow Errors
**Problema**: Workflows falhando silenciosamente  
**Solução**:
```javascript
// Adicionar error handling em todos workflows
{
  "nodes": [
    {
      "name": "Error Handler",
      "type": "n8n-nodes-base.errorTrigger",
      "position": [250, 300],
      "parameters": {}
    },
    {
      "name": "Send Error Alert",
      "type": "n8n-nodes-base.webhook",
      "position": [450, 300],
      "parameters": {
        "url": "={{$env.RECOVERY_API_URL}}/webhooks/n8n-error",
        "method": "POST",
        "bodyParameters": {
          "workflow": "={{$workflow.name}}",
          "error": "={{$json.error}}",
          "node": "={{$json.node}}",
          "timestamp": "={{$now}}"
        }
      }
    }
  ]
}
```

### 4. Email Deliverability
**Problema**: Emails indo para spam  
**Solução**:
```typescript
// Best practices para deliverability
const emailConfig = {
  // Sempre usar domínio verificado
  from: 'Recovery SaaS <noreply@verified-domain.com>',
  
  // Headers importantes
  headers: {
    'List-Unsubscribe': '<mailto:unsubscribe@verified-domain.com>',
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    'X-Entity-Ref-ID': generateUniqueId(),
  },
  
  // Tracking responsável
  trackOpens: true,
  trackClicks: true,
  
  // Tags para organização
  tags: [
    { name: 'event_type', value: event.type },
    { name: 'organization', value: event.organizationId },
  ],
};

// Aquecer IP gradualmente
const warmupSchedule = [
  { day: 1, volume: 50 },
  { day: 2, volume: 100 },
  { day: 3, volume: 200 },
  { day: 4, volume: 500 },
  { day: 5, volume: 1000 },
  // ... aumentar gradualmente
];
```

## 📚 Recursos e Links Úteis

### Documentação Oficial
- [Neon Docs](https://neon.tech/docs) - Branching, connection pooling
- [n8n Docs](https://docs.n8n.io) - Custom nodes, error handling
- [Bull Queue](https://docs.bullmq.io) - Advanced patterns
- [Resend Docs](https://resend.com/docs) - Best practices
- [React Email](https://react.email) - Component library

### Ferramentas de Debug
- [ngrok](https://ngrok.com) - Testar webhooks localmente
- [Webhook.site](https://webhook.site) - Debug webhook payloads
- [Mail Tester](https://www.mail-tester.com) - Verificar spam score
- [Redis Commander](https://github.com/joeferner/redis-commander) - GUI para Redis

### Performance
- [k6](https://k6.io) - Load testing para webhooks
- [clinic.js](https://clinicjs.org) - Node.js performance profiling
- [0x](https://github.com/davidmarkclements/0x) - Flame graphs

## 🎯 Checklist de Produção

### Segurança
- [ ] HMAC validation em todos webhooks
- [ ] Rate limiting configurado
- [ ] Secrets em variáveis de ambiente
- [ ] SSL/TLS em todas conexões
- [ ] Logs sem dados sensíveis
- [ ] CORS configurado corretamente

### Performance
- [ ] Connection pooling no PostgreSQL
- [ ] Redis com persistência
- [ ] Índices otimizados no banco
- [ ] Compressão gzip ativada
- [ ] CDN para assets estáticos

### Monitoramento
- [ ] Logs estruturados (Winston)
- [ ] Métricas (Prometheus)
- [ ] Alertas configurados
- [ ] Health checks
- [ ] Error tracking (Sentry)

### Backup & Recovery
- [ ] Backup automático do PostgreSQL
- [ ] Backup dos workflows n8n
- [ ] Disaster recovery plan
- [ ] Testes de restore

---

**Última atualização**: 2024-12-29 