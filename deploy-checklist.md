# 🚀 Deploy Checklist - Recovery SaaS

## 📋 Pré-Deploy

### 1. Variáveis de Ambiente
- [ ] Criar `.env.production` para backend
- [ ] Criar `.env.production` para dashboard
- [ ] Configurar secrets no Railway
- [ ] Configurar variáveis na Vercel

### 2. Banco de Dados (Neon)
- [ ] Criar branch de produção
- [ ] Rodar migrations
- [ ] Seed inicial (organização demo)
- [ ] Backup do banco de desenvolvimento

### 3. Redis (Upstash)
- [ ] Criar database de produção
- [ ] Copiar connection string
- [ ] Testar conexão

### 4. Resend
- [ ] Verificar domínio inboxrecovery.com
- [ ] Criar API key de produção
- [ ] Configurar webhook URL de produção

## 🔧 Deploy Backend (Railway)

### 1. Setup Inicial
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Criar projeto
railway init
```

### 2. Configuração
- [ ] Conectar repositório GitHub
- [ ] Branch: main
- [ ] Root directory: /backend
- [ ] Build command: `npm run build`
- [ ] Start command: `npm start`

### 3. Variáveis de Ambiente
```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
RESEND_API_KEY=re_...
NODE_ENV=production
PORT=4000
API_URL=https://recoverymail-api.up.railway.app
FRONTEND_URL=https://app.recoverymail.com
JWT_SECRET=...
```

### 4. Deploy
```bash
railway up
```

## 🎨 Deploy Dashboard (Vercel)

### 1. Setup Inicial
```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Criar projeto
cd dashboard
vercel
```

### 2. Configuração
- [ ] Framework: Next.js
- [ ] Root directory: /dashboard
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`

### 3. Variáveis de Ambiente
```env
NEXT_PUBLIC_API_URL=https://recoverymail-api.up.railway.app
NEXTAUTH_URL=https://app.recoverymail.com
NEXTAUTH_SECRET=...
```

### 4. Deploy
```bash
vercel --prod
```

## 🌐 Configuração de Domínios

### 1. API (Railway)
- [ ] Domínio customizado: api.recoverymail.com
- [ ] SSL automático
- [ ] CORS atualizado

### 2. Dashboard (Vercel)
- [ ] Domínio customizado: app.recoverymail.com
- [ ] SSL automático
- [ ] Redirect www → non-www

### 3. DNS (Cloudflare/Registro.br)
```
A     @              76.76.21.21        # Landing page
CNAME api            recoverymail-api.up.railway.app
CNAME app            cname.vercel-dns.com
CNAME email          inboxrecovery.com   # Para subdomain delegation
```

## 🔒 Segurança

### 1. Backend
- [ ] Ativar HMAC validation
- [ ] Rate limiting em produção
- [ ] Helmet.js configurado
- [ ] CORS restritivo

### 2. Dashboard
- [ ] CSP headers
- [ ] Secure cookies
- [ ] HTTPS only

### 3. Secrets
- [ ] JWT_SECRET forte (32+ chars)
- [ ] NEXTAUTH_SECRET forte
- [ ] Rotação de API keys

## 📊 Monitoramento

### 1. Sentry
- [ ] Criar projeto backend
- [ ] Criar projeto frontend
- [ ] Configurar DSN
- [ ] Testar error tracking

### 2. Uptime (Better Stack)
- [ ] Monitor API health
- [ ] Monitor dashboard
- [ ] Alertas por email/SMS

### 3. Analytics
- [ ] Google Analytics
- [ ] Mixpanel para eventos
- [ ] Hotjar para heatmaps

## ✅ Pós-Deploy

### 1. Testes de Produção
- [ ] Testar webhook real
- [ ] Enviar email teste
- [ ] Login no dashboard
- [ ] Verificar métricas

### 2. Documentação
- [ ] README atualizado
- [ ] API docs (Postman)
- [ ] Guia de integração
- [ ] FAQ

### 3. Backup
- [ ] Backup automático Neon
- [ ] Snapshot do código
- [ ] Export das variáveis

## 🎯 Comandos Úteis

```bash
# Railway
railway logs
railway status
railway variables

# Vercel
vercel logs
vercel env pull
vercel domains

# Monitoramento
curl https://api.recoverymail.com/health
curl https://app.recoverymail.com
```

## 📝 Notas Importantes

1. **Ordem de Deploy**: Backend primeiro, depois Dashboard
2. **Downtime**: Zero downtime esperado (primeiro deploy)
3. **Rollback**: Railway e Vercel têm rollback automático
4. **Custos**: 
   - Railway: ~$5-20/mês
   - Vercel: Free tier
   - Neon: Free tier (10GB)
   - Upstash: Free tier (10k comandos/dia)

## 🚨 Troubleshooting

### Erro comum 1: Database connection
- Verificar SSL mode
- Verificar IP whitelist

### Erro comum 2: CORS
- Atualizar FRONTEND_URL
- Verificar origins permitidas

### Erro comum 3: Build failed
- Verificar Node version
- Limpar cache
- Verificar dependências

---

**Tempo estimado**: 4-6 horas para deploy completo 