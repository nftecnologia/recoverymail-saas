# 📧 InboxRecovery - Recovery SaaS

Sistema inteligente de recuperação de vendas perdidas através de campanhas automatizadas de email. Processa webhooks de e-commerce e envia emails personalizados com timing otimizado para maximizar conversões.

## 🎯 Visão Geral

InboxRecovery transforma carrinhos abandonados e pagamentos expirados em vendas recuperadas através de:

- 📊 **Automação Inteligente**: Processamento de 12 tipos diferentes de eventos
- ⏰ **Timing Otimizado**: Delays customizados baseados em dados de conversão
- 📧 **Templates Persuasivos**: Emails responsivos com urgência progressiva
- 🔐 **Multi-tenancy Seguro**: Isolamento completo entre organizações
- 📈 **Métricas em Tempo Real**: Dashboard com taxa de recuperação

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- Conta no [Neon](https://neon.tech) (PostgreSQL)
- Conta no [Upstash](https://upstash.com) (Redis)
- Conta no [Resend](https://resend.com) (Email)

### Instalação Local

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/recoverymail.git
cd recoverymail

# 2. Configure o backend
cd backend
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# 4. Inicie os serviços locais
docker-compose up -d

# 5. Execute as migrations
npm run prisma:migrate dev

# 6. Inicie o servidor
npm run dev
```

### Teste Rápido

```bash
# Criar organização de teste
node test-webhook.js --setup

# Enviar webhook de teste
node test-webhook.js
```

## 📋 Webhooks Suportados

| Evento | Descrição | Delays de Email |
|--------|-----------|----------------|
| `ABANDONED_CART` | Carrinho abandonado | 2h, 24h, 72h |
| `BANK_SLIP_EXPIRED` | Boleto expirado | 30min, 24h, 48h |
| `PIX_EXPIRED` | PIX expirado | 15min, 2h |
| `SALE_REFUSED` | Pagamento recusado | 30min, 4h |
| `SALE_APPROVED` | Venda aprovada | Imediato |
| `BANK_SLIP_GENERATED` | Boleto gerado | 24h, 48h |
| `PIX_GENERATED` | PIX gerado | 30min |
| `SUBSCRIPTION_CANCELED` | Assinatura cancelada | 0, 7d, 30d |
| `SUBSCRIPTION_EXPIRED` | Assinatura expirada | 0, 3d |
| `SUBSCRIPTION_RENEWED` | Assinatura renovada | Imediato |

## 🏗️ Arquitetura

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  E-commerce │────▶│   Webhook   │────▶│    Redis    │
│  Platform   │     │   Handler   │     │   Queue     │
└─────────────┘     └─────────────┘     └─────────────┘
                            │                    │
                            ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  PostgreSQL │     │   Worker    │
                    │   (Neon)    │     │  (Bull)     │
                    └─────────────┘     └─────────────┘
                                                │
                                                ▼
                                        ┌─────────────┐
                                        │   Resend    │
                                        │   (Email)   │
                                        └─────────────┘
```

## 🔧 Stack Técnica

- **Backend**: Node.js + Express + TypeScript
- **Banco de Dados**: PostgreSQL (Neon)
- **Cache/Filas**: Redis (Upstash) + Bull
- **Email**: Resend API
- **Templates**: Handlebars
- **Validação**: Zod
- **ORM**: Prisma
- **Logging**: Winston
- **Segurança**: HMAC-SHA256

## 📁 Estrutura do Projeto

```
recoverymail/
├── backend/               # API REST e processamento
│   ├── src/
│   │   ├── config/       # Configurações
│   │   ├── handlers/     # Processadores de eventos
│   │   ├── middleware/   # Express middlewares
│   │   ├── routes/       # Rotas da API
│   │   ├── services/     # Serviços (email, queue)
│   │   ├── templates/    # Templates de email
│   │   ├── types/        # TypeScript types
│   │   ├── utils/        # Utilitários
│   │   └── workers/      # Background jobs
│   └── prisma/           # Schema do banco
├── memory-bank/          # Documentação do projeto
│   ├── snapshots/        # Histórico de desenvolvimento
│   └── *.md              # Contexto e documentação
└── docker-compose.yml    # Serviços locais
```

## 🔐 Segurança

### Validação HMAC

Todos os webhooks devem incluir assinatura HMAC:

```javascript
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(payload))
  .digest('hex');

headers['X-Webhook-Signature'] = `sha256=${signature}`;
```

### Multi-tenancy

- Isolamento por `organizationId`
- Webhook secrets únicos por organização
- Rate limiting por organização

## 📊 Configuração de Produção

### 1. Variáveis de Ambiente

```env
NODE_ENV=production
DATABASE_URL=postgres://...
REDIS_URL=rediss://...
RESEND_API_KEY=re_...
JWT_SECRET=...
```

### 2. Deploy

**Vercel:**
```bash
vercel --prod
```

**Railway:**
- Push para GitHub
- Conecte repositório
- Configure env vars

### 3. Criar Organização

```sql
INSERT INTO "Organization" (id, name, domain, "webhookSecret")
VALUES (
  'org_001',
  'Minha Loja',
  'minhaloja.com',
  'whsec_' || encode(gen_random_bytes(32), 'hex')
);
```

## 📈 Métricas e KPIs

- **Taxa de Recuperação**: % de carrinhos convertidos
- **Tempo Médio de Conversão**: Quanto tempo até comprar
- **ROI por Campanha**: Receita recuperada vs. custo
- **Taxa de Abertura**: % de emails abertos
- **Taxa de Clique**: % de cliques no CTA

## 🧪 Desenvolvimento

### Comandos Úteis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build produção
npm run lint         # Verificar código
npm run test         # Executar testes
npm run prisma:studio # Visualizar banco
```

### Adicionar Novo Webhook

1. Adicione o tipo em `types/webhook.types.ts`
2. Crie schema Zod em `utils/webhook.validator.ts`
3. Configure delays em `services/queue.service.ts`
4. Crie handler em `handlers/nomeEvento.handler.ts`
5. Adicione ao mapeamento em `workers/email.worker.ts`

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- Documentação: [docs.inboxrecovery.com](https://docs.inboxrecovery.com)
- Email: suporte@inboxrecovery.com
- Issues: [GitHub Issues](https://github.com/seu-usuario/recoverymail/issues)

---

Feito com ❤️ para aumentar suas vendas 📈 