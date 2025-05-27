#!/bin/bash

echo "🔄 Aguardando deploy do endpoint test-redis..."
echo "   Isso pode levar 2-3 minutos..."
echo ""

# Aguardar até o endpoint estar disponível
while true; do
    response=$(curl -s https://recoverymail.onrender.com/api/test-redis)
    
    # Verificar se não é mais a página de erro HTML
    if [[ ! "$response" =~ "Cannot GET" ]]; then
        echo "✅ Deploy concluído! Testando Redis..."
        echo ""
        echo "$response" | jq .
        break
    fi
    
    echo -n "."
    sleep 5
done

echo ""
echo "🧪 Executando teste completo do fluxo..."
echo ""
node test-full-flow.js 