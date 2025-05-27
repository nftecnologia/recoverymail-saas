#!/bin/bash

echo "🧪 Testando API no domínio customizado..."

# Teste 1: Health check
echo -e "\n1️⃣ Health Check:"
curl -s https://api.inboxrecovery.com/health | jq .

# Teste 2: Endpoint raiz
echo -e "\n2️⃣ Endpoint Raiz:"
curl -s https://api.inboxrecovery.com/ | jq .

# Teste 3: Enviar webhook
echo -e "\n3️⃣ Enviando webhook de teste:"
TIMESTAMP=$(date +%s)
curl -X POST https://api.inboxrecovery.com/webhook/test-org-123 \
  -H "Content-Type: application/json" \
  -d '{
    "event": "ABANDONED_CART",
    "checkout_id": "TEST-API-'$TIMESTAMP'",
    "checkout_url": "https://example.com/checkout/test",
    "total_price": "R$ 299,90",
    "customer": {
      "name": "Teste API Custom Domain",
      "email": "teste@api.inboxrecovery.com",
      "phone_number": "5511999999999"
    },
    "products": [
      {
        "name": "Produto Teste API",
        "price": "R$ 299,90",
        "quantity": 1
      }
    ]
  }' | jq .

# Teste 4: Verificar métricas
echo -e "\n4️⃣ Verificando métricas:"
curl -s https://api.inboxrecovery.com/api/dashboard/metrics \
  -H "x-organization-id: test-org-123" | jq .

echo -e "\n✅ Testes concluídos!" 