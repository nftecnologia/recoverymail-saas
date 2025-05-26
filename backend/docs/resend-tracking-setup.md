# Configuração do Tracking de Cliques - Resend

## Visão Geral

O sistema de rastreamento de cliques permite monitorar quando os destinatários:
- Abrem os emails (open tracking)
- Clicam nos links (click tracking)

## 1. Configuração no Dashboard do Resend

### Passo 1: Acessar Configurações de Webhook
1. Acesse [app.resend.com](https://app.resend.com)
2. Vá para **Settings** → **Webhooks**
3. Clique em **Add webhook**

### Passo 2: Configurar o Webhook
1. **Endpoint URL**: `https://seu-dominio.com/resend-webhook`
2. **Events**: Selecione todos:
   - ✅ email.sent
   - ✅ email.delivered
   - ✅ email.opened
   - ✅ email.clicked
   - ✅ email.bounced
   - ✅ email.complained

### Passo 3: Obter o Webhook Secret
1. Após criar o webhook, copie o **Signing secret**
2. Adicione ao seu `.env`:
```env
RESEND_WEBHOOK_SECRET=seu_signing_secret_aqui
```

## 2. Como Funciona o Tracking

### Open Tracking
- Um pixel invisível é adicionado ao email
- Quando o email é aberto, o pixel é carregado
- Resend envia um webhook com evento `email.opened`

### Click Tracking
- Links no email são reescritos para passar pelo Resend
- Quando clicados, o usuário é redirecionado ao destino
- Resend envia um webhook com evento `email.clicked`

## 3. Estrutura dos Eventos

### Evento de Abertura
```json
{
  "type": "email.opened",
  "created_at": "2025-05-26T12:00:00Z",
  "data": {
    "email_id": "msg_123456",
    "from": "recovery@inboxrecovery.com",
    "to": ["cliente@email.com"],
    "subject": "Você esqueceu alguns itens"
  }
}
```

### Evento de Clique
```json
{
  "type": "email.clicked",
  "created_at": "2025-05-26T12:05:00Z",
  "data": {
    "email_id": "msg_123456",
    "from": "recovery@inboxrecovery.com",
    "to": ["cliente@email.com"],
    "subject": "Você esqueceu alguns itens",
    "click": {
      "link": "https://loja.com/checkout",
      "timestamp": 1748274300,
      "user_agent": "Mozilla/5.0...",
      "ip_address": "200.100.50.25"
    }
  }
}
```

## 4. Monitoramento

### Script de Verificação
```bash
# Verificar status de tracking
node check-email-tracking.js
```

### Métricas Disponíveis
- Taxa de abertura: % de emails abertos
- Taxa de cliques: % de emails com cliques
- Tempo médio até abertura
- Links mais clicados

## 5. Boas Práticas

### Segurança
- ✅ Sempre valide a assinatura do webhook
- ✅ Use HTTPS para o endpoint
- ✅ Retorne 200 OK mesmo em erro (evita retry)

### Performance
- ✅ Processe webhooks de forma assíncrona
- ✅ Use índices no banco para `emailId`
- ✅ Implemente rate limiting no endpoint

### Privacidade
- ⚠️ Informe sobre tracking na política de privacidade
- ⚠️ Permita opt-out de tracking
- ⚠️ Cumpra com LGPD/GDPR

## 6. Troubleshooting

### Email não está sendo rastreado
1. Verifique se o webhook está configurado
2. Confirme que headers de tracking estão habilitados
3. Teste com email real (Gmail, Outlook)

### Webhook não está chegando
1. Verifique logs do servidor
2. Teste endpoint com cURL
3. Confirme que não há firewall bloqueando

### Assinatura inválida
1. Verifique se RESEND_WEBHOOK_SECRET está correto
2. Confirme encoding (deve ser base64)
3. Use crypto.timingSafeEqual para comparação

## 7. Exemplo de Teste Manual

```bash
# Testar endpoint localmente
curl -X POST http://localhost:4000/resend-webhook \
  -H "Content-Type: application/json" \
  -H "resend-signature: test" \
  -d '{
    "type": "email.clicked",
    "created_at": "2025-05-26T12:00:00Z",
    "data": {
      "email_id": "msg_test",
      "from": "test@example.com",
      "to": ["user@example.com"],
      "subject": "Test",
      "click": {
        "link": "https://example.com",
        "timestamp": 1748274300
      }
    }
  }'
``` 