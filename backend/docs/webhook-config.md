# Configurações de Webhooks

## Webhooks do Resend (Tracking de Email)

### Desenvolvimento (ngrok)
- **URL**: `https://80d1-2804-e8-8083-c600-8d3b-7f3e-8ed9-8a2.ngrok-free.app/resend-webhook`
- **Secret**: `whsec_6dBO8wxbUc4AJJ7PB9HkM4EdFYN1gvxj`
- **Status**: Ativo ✅

### Produção (InboxPilot)
- **URL**: `https://inboxpilot.com/resend-webhook`
- **Secret**: `whsec_gRdjfcEpk/tx8RSFeqSZvNgEYuoSsadK`
- **Status**: Configurado ✅

## Eventos Monitorados

Todos os webhooks estão configurados para receber:
- ✅ `email.sent` - Email enviado
- ✅ `email.delivered` - Email entregue
- ✅ `email.opened` - Email aberto
- ✅ `email.clicked` - Link clicado
- ✅ `email.bounced` - Email rejeitado
- ✅ `email.complained` - Marcado como spam

## Como Testar

### 1. Testar localmente (desenvolvimento)
```bash
# Certifique-se que o servidor está rodando
cd backend && npm run dev

# Em outro terminal, execute o teste
node test-resend-webhook.js

# Verificar estatísticas
node check-email-tracking.js
```

### 2. Testar com email real
1. Envie um webhook de teste (carrinho abandonado, PIX expirado, etc.)
2. Aguarde o email ser processado e enviado
3. Abra o email e clique em algum link
4. Verifique as estatísticas com `node check-email-tracking.js`

## Troubleshooting

### Webhook não está chegando
1. Verifique se o ngrok está rodando
2. Confirme que a URL no Resend está correta
3. Verifique os logs do servidor

### Assinatura inválida
1. Verifique se o `RESEND_WEBHOOK_SECRET` no `.env` está correto
2. Para desenvolvimento, use o secret do webhook ngrok
3. Para produção, use o secret do webhook de produção

### Estatísticas não atualizam
1. Certifique-se que os emails foram enviados com tracking habilitado
2. Aguarde alguns segundos após abrir/clicar
3. Verifique se o webhook está sendo processado nos logs

## Métricas Importantes

- **Taxa de Abertura**: Meta > 25%
- **Taxa de Cliques**: Meta > 10%
- **Tempo médio até abertura**: < 2 horas
- **Bounce Rate**: < 5% 