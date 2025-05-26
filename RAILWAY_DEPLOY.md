# Deploy do Inbox Recovery no Railway

## 📋 Pré-requisitos

1. Conta no [Railway](https://railway.app)
2. Conta no [Neon](https://neon.tech) com banco PostgreSQL criado
3. Conta no [Resend](https://resend.com) com API key
4. Conta no [Upstash](https://upstash.com) com Redis criado

## 🚀 Deploy Rápido

### 1. Criar Novo Projeto no Railway

1. Acesse [Railway Dashboard](https://railway.app/dashboard)
2. Clique em "New Project"
3. Escolha "Deploy from GitHub repo"
4. Conecte sua conta do GitHub se necessário
5. Selecione o repositório `recoverymail`
6. Railway detectará automaticamente o monorepo

### 2. Configurar Variáveis de Ambiente

No painel do Railway, vá em "Variables" e adicione:

```env
# Banco de Dados (Neon)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Redis (Upstash)
REDIS_URL=rediss://default:password@host:port

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Aplicação
NODE_ENV=production
PORT=4000
API_URL=https://seu-app.up.railway.app
JWT_SECRET=gere-uma-chave-segura-aqui

# n8n (Opcional)
N8N_API_KEY=n8n_api_xxxxxxxxxxxxx
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook

# Sentry (Opcional)
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### 3. Configurar Build e Deploy

O Railway já está configurado através do `railway.toml`, mas verifique:

1. **Service Settings**:
   - Root Directory: `/backend`
   - Build Command: `npm run build` (usa o build-force.sh)
   - Start Command: `npm start`

2. **Health Check**:
   - Path: `/health`
   - Port: 4000

### 4. Deploy

1. Após configurar as variáveis, o Railway iniciará o deploy automaticamente
2. Acompanhe os logs em "Deployments"
3. Aguarde o build e start do serviço

## 🔧 Configurações Importantes

### Banco de Dados (Neon)

1. Crie um projeto no Neon
2. Copie a connection string (com SSL)
3. Execute as migrations:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

### Redis (Upstash)

1. Crie um banco Redis no Upstash
2. Use a URL com TLS (rediss://)
3. Copie a URL completa com senha

### Email (Resend)

1. Verifique seu domínio no Resend
2. Crie uma API key
3. Configure o webhook secret para tracking

## 📊 Monitoramento

### Logs
- Acesse "Logs" no painel do Railway
- Filtros disponíveis por timestamp e nível

### Métricas
- CPU e Memória em "Metrics"
- Configure alertas se necessário

### Health Check
```bash
curl https://seu-app.up.railway.app/health
```

## 🚨 Troubleshooting

### Build Falha
- Verifique se todas as variáveis estão configuradas
- O build usa `build-force.sh` que ignora erros TypeScript
- Confira os logs de build no Railway

### Conexão com Banco Recusada
- Certifique-se que `sslmode=require` está na URL
- Verifique se o IP do Railway está liberado no Neon

### Redis Connection Error
- Use `rediss://` (com dois 's') para TLS
- Verifique se a URL inclui a senha

### Emails Não Enviados
- Confirme a API key do Resend
- Verifique os logs para erros específicos
- Teste com `node test-full-flow.js`

## 🔄 CI/CD

O deploy é automático via GitHub Actions:

1. Push para `main` dispara o workflow
2. Build e testes executam
3. Deploy automático no Railway

Para desabilitar temporariamente:
- Vá em Settings > Deploys > Disable automatic deploys

## 📝 Comandos Úteis

```bash
# Ver logs em tempo real
railway logs

# Executar comando no container
railway run npm run prisma:studio

# Variáveis de ambiente
railway variables

# Status do serviço
railway status
```

## 🎯 Próximos Passos

1. Configure um domínio customizado
2. Ative HTTPS (automático no Railway)
3. Configure backups do banco
4. Implemente monitoramento com Sentry
5. Configure rate limiting no Cloudflare

## 💡 Dicas

- Use `railway up` localmente para testar antes do deploy
- Configure branch preview para PRs
- Ative notificações de deploy no Discord/Slack
- Monitore uso de recursos para otimizar custos

---

**Não se esqueça de commitar** este arquivo:
```bash
git add RAILWAY_DEPLOY.md
git commit -m "Docs(deploy): adiciona guia completo para deploy no Railway"
git push origin main
``` 