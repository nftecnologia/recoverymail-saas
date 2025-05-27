# Guia de Configuração do Webhook - InboxRecovery

## 🎯 URL do Webhook

A URL do webhook para sua organização segue o padrão:

```
https://api.inboxrecovery.com/webhook/{ORG_ID}
```

Onde `{ORG_ID}` é o ID único da sua organização.

## 📋 Como Obter suas Credenciais

### 1. Via Dashboard

1. Acesse o dashboard em https://app.inboxrecovery.com
2. Vá para **Configurações** → **API**
3. Você encontrará:
   - **URL do Webhook**: URL completa para enviar os eventos
   - **Webhook Secret**: Chave para validar a assinatura dos webhooks
   - **API Key**: Chave para autenticação da API

### 2. Via API

```bash
curl https://api.inboxrecovery.com/api/settings \
  -H "x-organization-id: SEU_ORG_ID"
```

## 🔐 Segurança

### Validação de Assinatura

Todos os webhooks devem incluir o header `x-webhook-signature` com a assinatura HMAC-SHA256:

```javascript
const crypto = require('crypto');

function generateSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}

// Exemplo de envio
const signature = generateSignature(webhookData, 'seu-webhook-secret');

fetch('https://api.inboxrecovery.com/webhook/seu-org-id', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-webhook-signature': signature
  },
  body: JSON.stringify(webhookData)
});
```

## 📦 Formato dos Webhooks

### Estrutura Base

Todos os webhooks devem seguir esta estrutura:

```json
{
  "event": "TIPO_DO_EVENTO",
  "external_id": "id-unico-do-seu-sistema",
  "timestamp": "2024-01-15T10:30:00Z",
  // ... dados específicos do evento
}
```

### Eventos Suportados

#### 1. ABANDONED_CART (Carrinho Abandonado)

```json
{
  "event": "ABANDONED_CART",
  "checkout_id": "checkout-123",
  "checkout_url": "https://sualoja.com/checkout/123",
  "total_price": "R$ 299,90",
  "customer": {
    "name": "João Silva",
    "email": "joao@email.com",
    "phone_number": "5511999999999"
  },
  "products": [
    {
      "name": "Curso de Marketing Digital",
      "price": "R$ 299,90",
      "quantity": 1,
      "image_url": "https://sualoja.com/imagem.jpg"
    }
  ]
}
```

#### 2. PIX_EXPIRED (PIX Expirado)

```json
{
  "event": "PIX_EXPIRED",
  "transaction_id": "pix-456",
  "checkout_url": "https://sualoja.com/checkout/456",
  "total_price": "R$ 197,00",
  "pix_expiry_minutes": 30,
  "customer": {
    "name": "Maria Santos",
    "email": "maria@email.com",
    "phone_number": "5511888888888"
  },
  "product_name": "Mentoria Individual"
}
```

#### 3. BANK_SLIP_EXPIRED (Boleto Expirado)

```json
{
  "event": "BANK_SLIP_EXPIRED",
  "transaction_id": "boleto-789",
  "checkout_url": "https://sualoja.com/checkout/789",
  "total_price": "R$ 497,00",
  "expiry_date": "2024-01-20",
  "customer": {
    "name": "Pedro Costa",
    "email": "pedro@email.com",
    "phone_number": "5511777777777"
  },
  "product_name": "Pacote Premium"
}
```

## 🧪 Testando a Integração

### 1. Teste Manual

```bash
# Substitua pelos seus dados
ORG_ID="seu-org-id"
WEBHOOK_SECRET="seu-webhook-secret"

# Gerar assinatura (exemplo em bash)
PAYLOAD='{"event":"TEST","data":"teste"}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | cut -d' ' -f2)

# Enviar webhook de teste
curl -X POST https://api.inboxrecovery.com/webhook/$ORG_ID \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

### 2. Script de Teste (Node.js)

```javascript
const crypto = require('crypto');
const https = require('https');

const ORG_ID = 'seu-org-id';
const WEBHOOK_SECRET = 'seu-webhook-secret';

const testWebhook = {
  event: 'ABANDONED_CART',
  checkout_id: 'test-' + Date.now(),
  checkout_url: 'https://exemplo.com/checkout/teste',
  total_price: 'R$ 99,90',
  customer: {
    name: 'Teste Silva',
    email: 'teste@exemplo.com',
    phone_number: '5511999999999'
  },
  products: [{
    name: 'Produto Teste',
    price: 'R$ 99,90'
  }]
};

const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(JSON.stringify(testWebhook))
  .digest('hex');

const options = {
  hostname: 'api.inboxrecovery.com',
  path: `/webhook/${ORG_ID}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-webhook-signature': signature
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  res.on('data', (d) => {
    console.log('Resposta:', d.toString());
  });
});

req.write(JSON.stringify(testWebhook));
req.end();
```

## 📊 Monitoramento

### Verificar Status dos Eventos

```bash
curl https://api.inboxrecovery.com/api/events \
  -H "x-organization-id: SEU_ORG_ID"
```

### Verificar Emails Enviados

```bash
curl https://api.inboxrecovery.com/api/emails \
  -H "x-organization-id: SEU_ORG_ID"
```

## ❓ Problemas Comuns

### 1. Erro 401 - Unauthorized
- Verifique se a assinatura está correta
- Confirme que está usando o webhook secret correto

### 2. Erro 400 - Invalid Payload
- Verifique se o JSON está válido
- Confirme que todos os campos obrigatórios estão presentes

### 3. Erro 404 - Not Found
- Verifique se o ORG_ID está correto
- Confirme que a organização existe

### 4. Emails não são enviados
- Verifique se o evento está no formato correto
- Confirme que o email do cliente é válido
- Verifique os logs no dashboard

## 🆘 Suporte

Se precisar de ajuda:
1. Verifique os logs no dashboard
2. Consulte a documentação da API
3. Entre em contato: suporte@inboxrecovery.com

## 🔄 Próximos Passos

1. Configure o webhook no seu sistema
2. Implemente a validação de assinatura
3. Faça um teste com dados reais
4. Monitore os resultados no dashboard

---

**Lembre-se**: A URL correta do webhook sempre será:
```
https://api.inboxrecovery.com/webhook/{SEU_ORG_ID}
``` 