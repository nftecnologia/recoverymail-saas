# Recovery SaaS - Backend

Sistema de recuperação automática de vendas perdidas através de campanhas de email inteligentes.

## 🚀 Começando

### Pré-requisitos

- Node.js 18+
- PostgreSQL (ou conta no Neon)
- Redis
- Docker e Docker Compose (opcional, mas recomendado)

### Instalação

1. Clone o repositório e instale as dependências:

```bash
cd backend
npm install
```

2. Configure as variáveis de ambiente:

```bash
cp env.example .env
# Edite o arquivo .env com suas configurações
```

3. Suba os serviços com Docker:

```bash
docker-compose up -d
```

4. Execute as migrations do banco:

```bash
npm run prisma:generate
npm run prisma:migrate dev
```

5. Inicie o servidor:

```bash
npm run dev
```

## 📋 Estrutura do Projeto

```
backend/
├── src/
│   ├── config/         # Configurações (env, database)
│   ├── handlers/       # Processadores de eventos específicos
│   ├── middleware/     # Middlewares Express
│   ├── routes/         # Definição de rotas
│   ├── services/       # Serviços (filas, email, etc)
│   ├── templates/      # Templates de email Handlebars
│   ├── types/          # Tipos TypeScript
│   ├── utils/          # Utilitários (logger, errors)
│   ├── workers/        # Workers de processamento
│   └── server.ts       # Entrada principal
├── prisma/             # Schema e migrations
├── docker-compose.yml  # Serviços de desenvolvimento
└── test-webhook.js     # Script de teste
```

## 🔌 Webhooks Suportados

O sistema processa 12 tipos diferentes de webhooks:

1. **ABANDONED_CART** ✅ - Carrinho abandonado (100% implementado)
2. **BANK_SLIP_EXPIRED** 🟡 - Boleto expirado (handler básico)
3. **PIX_EXPIRED** 🟡 - PIX expirado (handler básico)
4. **SALE_REFUSED** 🟡 - Venda recusada (handler básico)
5. **SALE_APPROVED** 🔴 - Venda aprovada
6. **SALE_CHARGEBACK** 🔴 - Chargeback
7. **SALE_REFUNDED** 🔴 - Reembolso
8. **BANK_SLIP_GENERATED** 🔴 - Boleto gerado
9. **PIX_GENERATED** 🔴 - PIX gerado
10. **SUBSCRIPTION_CANCELED** 🔴 - Assinatura cancelada
11. **SUBSCRIPTION_EXPIRED** 🔴 - Assinatura expirada
12. **SUBSCRIPTION_RENEWED** 🔴 - Assinatura renovada

## 🧪 Testando

### Teste Local

1. Primeiro, crie uma organização de teste:

```bash
node test-webhook.js --setup
# Copie o SQL gerado e execute no banco
```

2. Envie um webhook de teste:

```bash
node test-webhook.js
```

### Validação HMAC

Todos os webhooks devem incluir o header `X-Webhook-Signature` com a assinatura HMAC-SHA256:

```javascript
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(payload))
  .digest('hex');

headers['X-Webhook-Signature'] = `sha256=${signature}`;
```

**Nota**: Por padrão, a validação HMAC está desativada para facilitar testes. Para ativar em produção, descomente a linha em `src/routes/webhook.routes.ts`.

## 🔄 Sistema de Filas

O sistema usa Bull + Redis para processar emails de forma assíncrona com delays customizados:

- **ABANDONED_CART**: 2h, 24h, 72h (com 10% de desconto)
- **BANK_SLIP_EXPIRED**: 30min, 24h, 48h
- **PIX_EXPIRED**: 15min, 2h
- **SALE_REFUSED**: 30min, 4h

## 📧 Templates de Email

Os templates são criados com Handlebars e suportam:

- Design responsivo (mobile-first)
- Personalização com dados do cliente
- Helpers para formatação (moeda, data)
- Cache em memória para performance
- Fallback para templates do banco de dados

### Templates Implementados:

1. **abandoned-cart-reminder.hbs** - Lembrete suave (2h)
2. **abandoned-cart-urgency.hbs** - Criando urgência (24h)
3. **abandoned-cart-discount.hbs** - Desconto 10% (72h)

## 📊 Monitoramento

### Health Check

```bash
curl http://localhost:4000/health
```

### Logs

Os logs são estruturados em JSON usando Winston:

```bash
# Desenvolvimento
npm run dev

# Produção
npm start | bunyan
```

### Bull Board (em breve)

Acesse `http://localhost:4000/admin/queues` para visualizar as filas.

## 🚀 Deploy

### Variáveis de Ambiente de Produção

```env
NODE_ENV=production
DATABASE_URL=postgresql://...@neon.tech/...
REDIS_URL=rediss://...@upstash.com:6379
RESEND_API_KEY=re_...
JWT_SECRET=... # Gere uma chave segura!
```

### Build

```bash
npm run build
npm start
```

### Deploy na Vercel/Railway

Veja o arquivo `PRODUCTION_SETUP.md` para instruções detalhadas.

## 📝 Scripts Disponíveis

- `npm run dev` - Desenvolvimento com hot reload
- `npm run build` - Build para produção
- `npm run start` - Iniciar em produção
- `npm run lint` - Verificar código
- `npm run format` - Formatar código
- `npm run prisma:generate` - Gerar Prisma Client
- `npm run prisma:migrate` - Executar migrations
- `npm run prisma:studio` - Abrir Prisma Studio

## 🔒 Segurança

- Validação HMAC-SHA256 para webhooks
- Rate limiting por organização
- Isolamento multi-tenant
- Secrets únicos por organização
- Sanitização de inputs com Zod

## 🤝 Contribuindo

1. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
2. Commit suas mudanças: `git commit -m 'feat: adiciona nova funcionalidade'`
3. Push: `git push origin feature/nova-funcionalidade`
4. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. 