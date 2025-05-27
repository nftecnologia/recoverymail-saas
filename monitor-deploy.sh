#!/bin/bash

echo "🔄 Monitorando deploy no Render..."
echo "   Build iniciado às $(date)"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar endpoints
check_endpoints() {
    echo -e "\n${YELLOW}Verificando endpoints...${NC}"
    
    # Health check
    health=$(curl -s https://recoverymail.onrender.com/health | jq -r '.status' 2>/dev/null)
    if [ "$health" = "healthy" ]; then
        echo -e "${GREEN}✓ Health check OK${NC}"
    else
        echo -e "${RED}✗ Health check falhou${NC}"
        return 1
    fi
    
    # Test endpoint
    test=$(curl -s https://recoverymail.onrender.com/api/test | jq -r '.message' 2>/dev/null)
    if [ "$test" = "API is working" ]; then
        echo -e "${GREEN}✓ Endpoint /api/test OK${NC}"
    else
        echo -e "${RED}✗ Endpoint /api/test não encontrado${NC}"
        return 1
    fi
    
    # Redis test
    redis=$(curl -s https://recoverymail.onrender.com/api/test-redis | jq -r '.redis' 2>/dev/null)
    if [ -n "$redis" ]; then
        echo -e "${GREEN}✓ Endpoint /api/test-redis OK${NC}"
        echo "  Status Redis: $redis"
    else
        echo -e "${RED}✗ Endpoint /api/test-redis não encontrado${NC}"
        return 1
    fi
    
    return 0
}

# Loop de verificação
attempt=0
max_attempts=60  # 5 minutos (5 segundos * 60)

while [ $attempt -lt $max_attempts ]; do
    if check_endpoints; then
        echo -e "\n${GREEN}🎉 Deploy concluído com sucesso!${NC}"
        echo "   Finalizado às $(date)"
        
        # Executar teste completo
        echo -e "\n${YELLOW}Executando teste completo...${NC}"
        node test-full-flow.js
        
        exit 0
    fi
    
    attempt=$((attempt + 1))
    echo -e "\n⏳ Tentativa $attempt/$max_attempts - Aguardando 5 segundos..."
    sleep 5
done

echo -e "\n${RED}❌ Timeout - Deploy demorou mais de 5 minutos${NC}"
exit 1 