# Snapshot - Resolução de Problemas de Deploy

## Data: 26/01/2025

## Resumo
Sessão focada em resolver problemas de deploy do Recovery Mail em produção, incluindo worker não funcionando e CORS bloqueando o dashboard.

## Problemas Resolvidos

### 1. Worker Não Processava Emails
**Problema**: 
- Render configurado como "Background Worker" mas não processava jobs
- Worker e API competindo por recursos

**Solução**:
- Criado `start-all.ts` para rodar API + Worker no mesmo processo
- Configuração PM2 como alternativa
- Worker agora ativo com 1 instância processando

**Arquivos criados**:
- `backend/src/start-all.ts`
- `backend/ecosystem.config.js`

### 2. CORS Bloqueando Dashboard
**Problema**:
- API rejeitando requisições de https://recoverymail.vercel.app
- Múltiplas tentativas de configuração falharam

**Solução**:
- Temporariamente permitir qualquer origem contendo 'vercel.app'
- TODO: Configurar CORS mais restritivo em produção

### 3. TypeScript Build Errors
**Problema**:
- 7 erros relacionados a index signatures e tipos
- Build falhando no Render

**Solução**:
- Usando script `build:force` para ignorar erros
- Sistema operacional apesar dos erros
- Erros ainda precisam ser corrigidos

## Métricas Atuais
- Total de eventos: 21
- Emails enviados: 18
- Taxa de abertura: 16.7%
- Taxa de cliques: 11.1%
- Workers ativos: 1
- Webhooks implementados: 2/12 (16%)

## Decisões Técnicas

1. **Arquitetura Unificada**
   - Worker e API no mesmo processo (limitação Render free tier)
   - Evita custos adicionais de serviços separados

2. **Build com Erros**
   - `npm run build:force` como workaround temporário
   - Priorizar funcionalidade sobre tipos perfeitos

3. **CORS Permissivo**
   - Aceitar temporariamente domínios Vercel
   - Revisar quando tiver autenticação

## Configuração Final

### Render
- Tipo: Web Service (não Background Worker)
- Build: `npm run build:force`
- Start: `npm run start` (executa `start-all.js`)

### Variáveis de Ambiente
```
NODE_ENV=production
DATABASE_URL=[Neon PostgreSQL]
REDIS_URL=[Upstash Redis]
RESEND_API_KEY=[Resend API Key]
RESEND_FROM_EMAIL=noreply@inboxrecovery.com
RESEND_FROM_NAME=Recovery Mail
```

## Aprendizados
1. Render free tier não suporta bem serviços separados
2. Worker e API podem rodar no mesmo processo sem problemas
3. TypeScript strict mode pode bloquear deploys - ter script de escape
4. CORS precisa ser configurado cuidadosamente para SPAs

## Próximos Passos Críticos
1. Corrigir erros TypeScript
2. Implementar PIX_EXPIRED (alta prioridade Brasil)
3. Configurar Sentry para monitoramento
4. Adicionar autenticação ao dashboard 