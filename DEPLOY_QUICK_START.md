# 🚀 Deploy Quick Start - Recovery SaaS

## 🎯 O que fazer AGORA (Passo a Passo)

### 1️⃣ Preparar o Backend para Deploy (15 min)

```bash
cd backend

# Criar arquivo de build
npm run build

# Testar build localmente
NODE_ENV=production npm start
```

### 2️⃣ Criar Conta no Railway (5 min)
1. Acesse https://railway.app
2. Faça login com GitHub
3. Crie um novo projeto

### 3️⃣ Deploy Backend no Railway (20 min)

No dashboard do Railway:
1. **New Project** → **Deploy from GitHub repo**
2. Selecione seu repositório
3. Configure:
   - Root Directory: `/backend`
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm start`

4. **Variables** → Adicione:
```
DATABASE_URL=(copie do Neon)
REDIS_URL=(copie do Upstash)
RESEND_API_KEY=(sua key do Resend)
NODE_ENV=production
PORT=4000
JWT_SECRET=recovery-saas-secret-key-2024
```

5. **Deploy** → Railway fará o build e deploy automaticamente

### 4️⃣ Preparar Dashboard (10 min)

```bash
cd dashboard

# Criar .env.production
echo "NEXT_PUBLIC_API_URL=https://seu-projeto.up.railway.app" > .env.production
echo "NEXTAUTH_SECRET=your-nextauth-secret-here" >> .env.production

# Build local para testar
npm run build
```

### 5️⃣ Deploy Dashboard na Vercel (15 min)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Responda:
# - Setup and deploy? Y
# - Which scope? (selecione sua conta)
# - Link to existing project? N
# - Project name? recovery-saas-dashboard
# - Directory? ./
# - Override settings? N
```

### 6️⃣ Configurar Variáveis na Vercel

No dashboard da Vercel:
1. Settings → Environment Variables
2. Adicione:
   - `NEXT_PUBLIC_API_URL` = URL do Railway
   - `NEXTAUTH_URL` = https://recovery-saas-dashboard.vercel.app
   - `NEXTAUTH_SECRET` = mesmo secret usado no .env

3. Redeploy: `vercel --prod`

## ✅ Verificação Rápida

### Backend (Railway)
```bash
curl https://seu-projeto.up.railway.app/health
# Deve retornar: {"status":"healthy"...}
```

### Dashboard (Vercel)
1. Acesse: https://recovery-saas-dashboard.vercel.app
2. Tente fazer login com: admin@recoverymail.com / admin123

## 🎉 Pronto!

Seu MVP está no ar! Agora você pode:
1. Testar enviando um webhook real
2. Ver as métricas no dashboard
3. Compartilhar com beta testers

## 🔧 Próximos Passos (Opcional)

### Domínio Customizado
- Railway: Settings → Domains → Add Custom Domain
- Vercel: Settings → Domains → Add Domain

### Monitoramento
- Sentry: https://sentry.io (erro tracking)
- Better Stack: https://betterstack.com (uptime)

### Segurança
- Ative HMAC validation no backend
- Configure rate limiting
- Troque os secrets padrão

---

**Tempo total estimado: 1 hora** ⏱️

Precisa de ajuda? Os logs estão em:
- Railway: `railway logs`
- Vercel: `vercel logs` 