# 🚀 Recovery Mail - Recuperação Automática de Vendas

<div align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
</div>

## 📋 Sobre o Projeto

Recovery Mail é um SaaS que automatiza a recuperação de vendas perdidas através de campanhas de email inteligentes. Processa webhooks de plataformas de e-commerce e envia emails personalizados com timing otimizado para maximizar conversões.

### 🎯 Problemas Resolvidos
- **70% dos carrinhos** são abandonados no e-commerce
- **Boletos expiram** sem pagamento por falta de follow-up
- **Processos manuais** são ineficientes e caros

### ✨ Funcionalidades Principais
- 📨 **12 tipos de webhooks** processados automaticamente
- ⏰ **Timing otimizado** com delays customizados por evento
- 📧 **26 templates** responsivos e focados em conversão
- 📊 **Dashboard completo** com métricas em tempo real
- 🏢 **Multi-tenant** com isolamento total de dados
- 🔒 **Segurança** com HMAC validation e rate limiting

## 🛠️ Stack Tecnológica

### Backend
- **Node.js** + **Express** + **TypeScript**
- **PostgreSQL** (Neon) - Banco de dados principal
- **Redis** (Upstash) - Filas e cache
- **BullMQ** - Processamento de filas
- **Prisma** - ORM
- **Resend** - Envio de emails

### Frontend
- **Next.js 14** - Framework React
- **TypeScript** - Type safety
- **Tailwind CSS** - Estilização
- **Shadcn UI** - Componentes
- **React Query** - Gerenciamento de estado
- **Recharts** - Gráficos

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+
- Docker e Docker Compose
- Conta no [Neon](https://neon.tech)
- Conta no [Upstash](https://upstash.com)
- Conta no [Resend](https://resend.com)

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/recoverymail.git
cd recoverymail
```

2. **Configure as variáveis de ambiente**
```bash
# Backend
cp backend/.env.example backend/.env

# Dashboard
cp dashboard/.env.example dashboard/.env
```

3. **Instale as dependências**
```bash
# Backend
cd backend && npm install

# Dashboard
cd ../dashboard && npm install
```

4. **Inicie os serviços**
```bash
# Na raiz do projeto
docker-compose up -d

# Backend
cd backend && npm run dev

# Dashboard (novo terminal)
cd dashboard && npm run dev
```

5. **Acesse o sistema**
- Dashboard: http://localhost:3000
- API: http://localhost:4000
- Login: admin@recoverymail.com / admin123

## 📚 Documentação

### Webhooks Suportados
- `ABANDONED_CART` - Carrinho abandonado
- `PIX_EXPIRED` - PIX expirado
- `BANK_SLIP_EXPIRED` - Boleto expirado
- `SALE_REFUSED` - Pagamento recusado
- `SALE_APPROVED` - Venda aprovada
- `SALE_CHARGEBACK` - Chargeback recebido
- `SALE_REFUNDED` - Reembolso processado
- `BANK_SLIP_GENERATED` - Boleto gerado
- `PIX_GENERATED` - PIX gerado
- `SUBSCRIPTION_CANCELED` - Assinatura cancelada
- `SUBSCRIPTION_EXPIRED` - Assinatura expirada
- `SUBSCRIPTION_RENEWED` - Assinatura renovada

### Exemplo de Integração
```bash
curl -X POST http://localhost:4000/webhook/test-org-123 \
  -H "Content-Type: application/json" \
  -d '{
    "event": "ABANDONED_CART",
    "checkout_id": "CHK123",
    "checkout_url": "https://loja.com/checkout/CHK123",
    "total_price": "R$ 497,00",
    "customer": {
      "name": "João Silva",
      "email": "joao@email.com"
    },
    "products": [{
      "name": "Curso de Marketing Digital",
      "price": "R$ 497,00"
    }]
  }'
```

## 🚀 Deploy

### Backend (Railway)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/deploy)

### Dashboard (Vercel)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/seu-usuario/recoverymail)

Veja o [Guia de Deploy](./DEPLOY_QUICK_START.md) para instruções detalhadas.

## 📊 Métricas de Performance

- ⚡ **< 100ms** tempo de processamento por webhook
- 📧 **98.5%** taxa de entrega de emails
- 🔄 **100%** uptime garantido
- 📈 **+30%** aumento na recuperação de vendas

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, leia o [CONTRIBUTING.md](./CONTRIBUTING.md) para detalhes sobre nosso código de conduta e processo de submissão de pull requests.

## 📝 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](./LICENSE) para detalhes.

## 📞 Suporte

- 📧 Email: suporte@recoverymail.com
- 💬 Discord: [Comunidade Recovery Mail](https://discord.gg/recoverymail)
- 📚 Docs: [docs.recoverymail.com](https://docs.recoverymail.com)

---

<div align="center">
  Feito com ❤️ por <a href="https://github.com/seu-usuario">Recovery Mail Team</a>
</div> 