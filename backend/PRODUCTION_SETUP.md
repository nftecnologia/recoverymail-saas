# Configuração de Produção - Recovery SaaS

## 🚀 Pré-requisitos

- Node.js 18+ instalado
- Conta na Vercel ou Railway para deploy
- Credenciais já configuradas (Neon, Upstash, Resend)

## 📋 Checklist de Deploy

### 1. Variáveis de Ambiente

Crie um arquivo `.env.production` com suas credenciais:

```env
# Node Environment
NODE_ENV=production

# Server
PORT=4000
API_URL=https://api.inboxrecovery.com
FRONTEND_URL=https://inboxrecovery.com

# Database (Neon PostgreSQL) - Use a URL com pooler
DATABASE_URL=postgres://neondb_owner:npg_NqOmv8T4LYGk@ep-late-haze-acf7qkxr-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require

# Redis (Upstash) - URL com TLS
REDIS_URL=rediss://default:AW0GAAIjcDFiYjAwNzJlYmJjYTA0ZjgwOTE5ZDZmMzM1ODg4OTE2YXAxMA@amused-crane-27910.upstash.io:6379

# Email (Resend)
RESEND_API_KEY=re_gwJdZjaH_N1jPvEUSNeGzY3ZHepSR8MAh
RESEND_DOMAIN=inboxrecovery.com
RESEND_FROM_EMAIL=recovery@inboxrecovery.com
RESEND_FROM_NAME=InboxRecovery

# Security - MUDE ISSO!
JWT_SECRET=gere-uma-chave-segura-com-64-caracteres-aqui

# Logging
LOG_LEVEL=info
```

### 2. Configuração do Banco de Dados

```bash
# Gerar Prisma Client
npm run prisma:generate

# Executar migrations em produção
DATABASE_URL="sua-url-de-producao" npm run prisma:migrate deploy
```

### 3. Criar Organização Inicial

Execute este SQL no Neon Console:

```sql
-- Criar organização de teste/demo
INSERT INTO "Organization" (
  id, 
  name, 
  domain,
  "webhookSecret", 
  "createdAt", 
  "updatedAt"
) VALUES (
  'org_demo_001',
  'Demo Store',
  'demo.inboxrecovery.com',
  'whsec_' || encode(gen_random_bytes(32), 'hex'),
  NOW(),
  NOW()
);

-- Ver o webhook secret gerado
SELECT id, name, "webhookSecret" FROM "Organization" WHERE id = 'org_demo_001';
```

### 4. Ativar Validação HMAC

Em `src/routes/webhook.routes.ts`, descomente a linha de validação HMAC:

```typescript
// De:
// router.post('/:orgId', validateHMAC, async (req, res, next) => {
router.post('/:orgId', async (req, res, next) => {

// Para:
router.post('/:orgId', validateHMAC, async (req, res, next) => {
// router.post('/:orgId', async (req, res, next) => {
```

### 5. Build para Produção

```bash
# Build do projeto
npm run build

# Testar localmente
NODE_ENV=production npm start
```

### 6. Deploy na Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configurar variáveis de ambiente no dashboard da Vercel
```

### 7. Deploy no Railway

```bash
# Via GitHub
# 1. Faça push do código para o GitHub
# 2. Conecte o repositório no Railway
# 3. Configure as variáveis de ambiente
# 4. Deploy automático a cada push
```

## 🔒 Segurança em Produção

### Configurações Obrigatórias:

1. **JWT_SECRET**: Gere uma chave segura
   ```bash
   openssl rand -base64 64
   ```

2. **Webhook Secret**: Cada organização deve ter seu próprio secret
   ```sql
   UPDATE "Organization" 
   SET "webhookSecret" = 'whsec_' || encode(gen_random_bytes(32), 'hex')
   WHERE "webhookSecret" IS NULL;
   ```

3. **Rate Limiting**: Ajuste conforme necessário
   ```env
   RATE_LIMIT_WINDOW_MS=60000  # 1 minuto
   RATE_LIMIT_MAX_REQUESTS=10  # 10 requests por minuto
   ```

4. **CORS**: Configure domínios permitidos em `server.ts`
   ```typescript
   app.use(cors({
     origin: ['https://inboxrecovery.com', 'https://app.inboxrecovery.com'],
     credentials: true,
   }));
   ```

## 📊 Monitoramento

### 1. Logs
- Vercel: Dashboard → Functions → Logs
- Railway: Dashboard → Deployments → Logs

### 2. Métricas do Redis (Upstash)
- Acesse: https://console.upstash.com
- Monitore: Comandos/segundo, Memória usada, Latência

### 3. Emails (Resend)
- Acesse: https://resend.com/emails
- Monitore: Taxa de entrega, Bounces, Complaints

### 4. Banco de Dados (Neon)
- Acesse: https://console.neon.tech
- Monitore: Queries/segundo, Conexões ativas, Storage

## 🧪 Teste de Produção

```javascript
// test-production.js
const axios = require('axios');
const crypto = require('crypto');

const API_URL = 'https://api.inboxrecovery.com';
const ORG_ID = 'org_demo_001';
const WEBHOOK_SECRET = 'seu-webhook-secret-aqui'; // Do banco

const payload = {
  event: 'ABANDONED_CART',
  checkout_id: 'TEST-' + Date.now(),
  checkout_url: 'https://demo.store/checkout/recover/test',
  total_price: 'R$ 99,90',
  customer: {
    name: 'Teste Produção',
    email: 'seu-email@gmail.com', // Use seu email real
    phone_number: '11999999999'
  },
  products: [{
    name: 'Produto Teste',
    price: 'R$ 99,90',
    quantity: 1
  }]
};

const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(JSON.stringify(payload))
  .digest('hex');

axios.post(`${API_URL}/webhook/${ORG_ID}`, payload, {
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': `sha256=${signature}`
  }
}).then(res => {
  console.log('✅ Webhook enviado:', res.data);
}).catch(err => {
  console.error('❌ Erro:', err.response?.data || err.message);
});
```

## 🚨 Troubleshooting

### Erro: "Invalid webhook signature"
- Verifique se o webhook secret está correto
- Confirme que está enviando o header X-Webhook-Signature
- O payload deve ser stringificado exatamente como enviado

### Erro: "Organization not found"
- Verifique se o org_id existe no banco
- Execute o SQL de criação da organização

### Emails não chegam
- Verifique o log no Resend Dashboard
- Confirme que o domínio está verificado
- Teste com um email diferente

### Redis connection refused
- Confirme que está usando rediss:// (com S) para Upstash
- Verifique se o token está correto
- Teste a conexão: `redis-cli -u $REDIS_URL ping`

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs detalhados
2. Consulte a documentação das APIs
3. Entre em contato: suporte@inboxrecovery.com 