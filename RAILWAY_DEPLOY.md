# 🚂 Configuração de Deploy Automático - Railway + GitHub

## 📋 Passos para Configurar

### 1. No Railway Dashboard

1. Acesse seu projeto: https://railway.com/project/955f4b09-a6a6-49b8-b36f-098c21b2bc7e

2. Vá em **Settings** → **General**

3. Em **Service**, conecte ao GitHub:
   - Clique em **Connect GitHub repo**
   - Autorize o Railway a acessar seu GitHub
   - Selecione o repositório `nicolasferoli/recoverymail`
   - Escolha a branch `main`

4. Configure o **Root Directory**:
   - Root Directory: `/backend`

5. Configure as **Environment Variables**:
   ```
   DATABASE_URL=postgresql://...
   REDIS_URL=redis://...
   RESEND_API_KEY=re_...
   NODE_ENV=production
   PORT=4000
   JWT_SECRET=...
   API_URL=https://inbox-recovery-backend-production.up.railway.app
   FRONTEND_URL=https://app.inboxrecovery.com
   ```

### 2. No GitHub

1. Vá em **Settings** → **Secrets and variables** → **Actions**

2. Crie um novo secret:
   - Name: `RAILWAY_TOKEN`
   - Value: (veja como obter abaixo)

### 3. Obter Railway Token

1. Acesse: https://railway.app/account/tokens
2. Clique em **"Create Token"**
3. Nome do token: `github-actions`
4. Copie o token gerado (ele só aparece uma vez!)
5. Cole no GitHub Secret

### 4. Configuração Automática

Com os arquivos já criados:
- `railway.json` - Configuração do Railway
- `nixpacks.toml` - Configuração do build
- `.github/workflows/deploy.yml` - CI/CD automático

O deploy será feito automaticamente a cada push na branch `main`!

## 🚀 Como Funciona

1. **Push para main** → GitHub Actions inicia
2. **Testes executados** → Lint, Build, Tests
3. **Deploy automático** → Railway faz o deploy
4. **Notificação** → Você recebe status no GitHub

## 🔧 Comandos Úteis

```bash
# Ver logs do Railway
railway logs

# Ver status do deploy
railway status

# Fazer deploy manual
railway up

# Ver variáveis de ambiente
railway variables
```

## 📊 Monitoramento

- **Logs**: https://railway.com/project/955f4b09-a6a6-49b8-b36f-098c21b2bc7e/logs
- **Métricas**: https://railway.com/project/955f4b09-a6a6-49b8-b36f-098c21b2bc7e/metrics
- **Deploys**: https://railway.com/project/955f4b09-a6a6-49b8-b36f-098c21b2bc7e/deployments

## ⚠️ Importante

- Sempre teste localmente antes de fazer push
- Configure as variáveis de ambiente ANTES do primeiro deploy
- O health check está em `/health`
- O Railway tem restart automático em caso de falha 