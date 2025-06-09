# 🧪 **RECOVERY SAAS - GUIA DE TESTES**

## 📋 **VISÃO GERAL**

Este guia contém instruções completas para testar e validar o Recovery SaaS antes do deploy em produção.

## 🚀 **EXECUTAR TODOS OS TESTES**

### **Comando Rápido:**
```bash
# Executar suite completa de testes
node test-system-complete.js
```

### **Configuração das Variáveis:**
```bash
# Definir URLs de teste
export WEBHOOK_URL="http://localhost:3000/webhook/test-org-123"
export API_URL="http://localhost:3000/api"
export TEST_EMAIL="seu-email@teste.com"
export WEBHOOK_SECRET="seu-secret-key"

# Executar testes
node test-system-complete.js
```

## 🎯 **TESTES INDIVIDUAIS**

### **1. Teste ABANDONED_CART**
```bash
node test-abandoned-cart-complete.js
```
**Valida:**
- ✅ Webhook receiver aceita payload
- ✅ Validação HMAC funciona
- ✅ Dados salvos no banco
- ✅ Filas configuradas (2h, 24h, 72h)
- ✅ Templates mapeados corretamente

### **2. Teste SALE_REFUSED**
```bash
node test-sale-refused-complete.js
```
**Valida:**
- ✅ Motivos de recusa mapeados
- ✅ Alternativas de pagamento
- ✅ Cronograma urgente (15min, 2h, 24h)
- ✅ Descontos crescentes

### **3. Teste PIX_EXPIRED**
```bash
# Incluído no test-system-complete.js
node test-system-complete.js
```
**Valida:**
- ✅ QR Code e código copia/cola
- ✅ Timing crítico (15min, 2h)
- ✅ Templates otimizados

### **4. Teste SUBSCRIPTION_CANCELED**
```bash
# Incluído no test-system-complete.js
node test-system-complete.js
```
**Valida:**
- ✅ Win-back campaigns
- ✅ Estratégias por motivo
- ✅ Descontos progressivos

## 📊 **TESTE DAS APIs DASHBOARD**

### **Endpoints Testados:**
```bash
GET /api/dashboard/metrics
GET /api/dashboard/events?page=1&limit=10
GET /api/dashboard/emails?page=1&limit=10
```

### **Campos Validados:**
```json
// Métricas
{
  "totalEvents": 150,
  "totalEmails": 450,
  "openRate": 24.5,
  "clickRate": 8.2
}

// Eventos
{
  "events": [...],
  "total": 150,
  "page": 1,
  "limit": 10
}

// Emails
{
  "emails": [...],
  "total": 450,
  "page": 1,
  "limit": 10
}
```

## 🔧 **PREPARAÇÃO PARA TESTES**

### **1. Iniciar Servidor Backend:**
```bash
cd backend
npm run dev
```

### **2. Verificar Banco de Dados:**
```bash
# PostgreSQL deve estar conectado
# Tabelas devem existir (webhookEvent, emailLog, etc.)
```

### **3. Configurar Resend:**
```bash
# Definir RESEND_API_KEY no .env
export RESEND_API_KEY="re_sua_chave_aqui"
```

### **4. Configurar Trigger.dev:**
```bash
# Verificar se Trigger.dev está configurado
# Tasks devem estar registradas
```

## 📈 **INTERPRETAÇÃO DOS RESULTADOS**

### **✅ Teste PASSOU:**
- Status 200 no webhook
- Dados salvos no banco
- Filas configuradas
- Templates funcionando

### **⚠️ Teste PARCIAL:**
- Webhook aceito mas APIs com campos faltando
- Alguns componentes não configurados
- Necessita investigação

### **❌ Teste FALHOU:**
- Erro de conexão
- Validação HMAC falhou
- Servidor não responde
- Configuração incorreta

## 🎯 **CRITÉRIOS DE SUCESSO**

### **Taxa de Sucesso Mínima: 80%**

**EXCELENTE (90%+):**
- Todos webhooks funcionando
- APIs completas
- Sistema pronto para produção

**BOM (80-89%):**
- Webhooks principais OK
- APIs funcionais
- Pequenos ajustes necessários

**CRÍTICO (<80%):**
- Problemas sérios
- Correções obrigatórias
- Não deploy até resolver

## 🔍 **DIAGNÓSTICO DE PROBLEMAS**

### **Webhook não aceito (Status 400/500):**
```bash
# Verificar logs do servidor
tail -f backend/logs/app.log

# Verificar validação HMAC
console.log('HMAC calculado:', signature);
console.log('HMAC recebido:', headers['x-webhook-signature']);

# Verificar schema Zod
console.log('Payload validation error:', error.errors);
```

### **APIs retornando erro:**
```bash
# Verificar conexão com banco
npm run prisma:studio

# Verificar rotas registradas
console.log('Registered routes:', app._router.stack);

# Verificar middleware de auth
console.log('Auth middleware executed');
```

### **Templates não renderizando:**
```bash
# Verificar mapeamento
console.log('Template mapping:', EMAIL_TEMPLATES);

# Verificar arquivos existem
ls backend/src/templates/emails/

# Verificar dados do template
console.log('Template data:', templateData);
```

## 🚀 **PRÓXIMOS PASSOS APÓS TESTES**

### **Se Taxa ≥ 80%:**
1. ✅ Sistema validado
2. 🎨 Conectar frontend Dashboard
3. 🚀 Deploy produção
4. 📈 Marketing e vendas

### **Se Taxa < 80%:**
1. 🔧 Corrigir falhas
2. 🧪 Executar testes novamente
3. 📝 Verificar logs detalhados
4. 🔄 Repetir até passar

## 📝 **LOGS E DEBUGGING**

### **Logs do Sistema:**
```bash
# Backend
tail -f backend/logs/app.log

# Trigger.dev
# Verificar dashboard: https://cloud.trigger.dev

# Database
# Verificar Neon dashboard
```

### **Debug Webhook:**
```javascript
// Adicionar no handler
console.log('Webhook received:', {
  eventType: req.headers['x-event-type'],
  signature: req.headers['x-webhook-signature'],
  body: req.body
});
```

## 🎯 **CHECKLIST PRÉ-PRODUÇÃO**

- [ ] ✅ Todos testes passando (80%+)
- [ ] ✅ Webhooks principais funcionando
- [ ] ✅ APIs Dashboard completas
- [ ] ✅ Templates renderizando
- [ ] ✅ Emails sendo enviados
- [ ] ✅ Banco de dados persistindo
- [ ] ✅ Filas processando
- [ ] ✅ Logs estruturados
- [ ] ✅ Error handling robusto
- [ ] ✅ Performance aceitável

---

## 🏆 **RECOVERY SAAS TESTE COMPLETO**

**Execute os testes e valide que o sistema está 100% funcional antes de avançar para produção!**

```bash
# Comando final
node test-system-complete.js
```

**Taxa de sucesso ≥ 80% = PRONTO PARA PRODUÇÃO! 🚀**
