#!/usr/bin/env node

const https = require('https');

// Configurações
const API_URL = 'api.inboxrecovery.com';
const ORG_ID = 'test-org-123';
const TEST_EMAIL = 'nicolas.fer.oli@gmail.com';

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Gerar dados do PIX
const pixData = {
  event: 'PIX_EXPIRED',
  pix_id: `PIX-${Date.now()}`,
  transaction_id: `TRX-${Date.now()}`,
  pix_qr_code: '00020126580014BR.GOV.BCB.PIX0136123e4567-e12b-12d1-a456-426614174000',
  pix_qr_code_image: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020126580014BR.GOV.BCB.PIX',
  pix_copy_paste: '00020126580014BR.GOV.BCB.PIX0136123e4567-e12b-12d1-a456-426614174000',
  total_price: 'R$ 197,90',
  amount: 197.90,
  expiration_time: '30 minutos',
  checkout_url: 'https://loja.exemplo.com/checkout/pix-expired-test',
  new_pix_url: 'https://loja.exemplo.com/checkout/novo-pix',
  support_url: 'https://loja.exemplo.com/suporte',
  customer: {
    name: 'Teste PIX Expirado',
    email: TEST_EMAIL,
    phone_number: '5511999999999',
    document: '12345678900'
  },
  products: [
    {
      name: 'Curso de JavaScript Avançado',
      price: 'R$ 197,90',
      quantity: 1,
      image_url: 'https://via.placeholder.com/200x200?text=JS+Course'
    }
  ],
  metadata: {
    order_id: `ORDER-${Date.now()}`,
    payment_method: 'pix',
    test: true
  }
};

// Função para fazer a requisição
function sendWebhook() {
  const data = JSON.stringify(pixData);
  
  const options = {
    hostname: API_URL,
    port: 443,
    path: `/webhook/${ORG_ID}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  log('\n🚀 Enviando webhook PIX_EXPIRED...', 'bright');
  log(`📍 URL: https://${API_URL}/webhook/${ORG_ID}`, 'cyan');
  log(`📧 Email: ${TEST_EMAIL}`, 'cyan');
  log(`💰 Valor: ${pixData.total_price}`, 'cyan');
  log(`⏱️  PIX ID: ${pixData.pix_id}`, 'cyan');

  const req = https.request(options, (res) => {
    let body = '';
    
    res.on('data', (chunk) => {
      body += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200 || res.statusCode === 201) {
        log('\n✅ Webhook enviado com sucesso!', 'green');
        
        try {
          const response = JSON.parse(body);
          log(`📝 Event ID: ${response.eventId}`, 'green');
          log(`📊 Status: ${response.status}`, 'green');
          
          log('\n📧 Emails programados:', 'yellow');
          log('  1️⃣  Em 15 minutos: "⏱️ Seu PIX expirou - Gere um novo código"', 'yellow');
          log('  2️⃣  Em 2 horas: "⚡ Último PIX disponível com 10% OFF"', 'yellow');
          
          log('\n💡 Dicas:', 'blue');
          log('  - Verifique seu email em 15 minutos', 'blue');
          log('  - O segundo email chegará em 2 horas', 'blue');
          log('  - Clique nos links para testar o tracking', 'blue');
          
          log('\n🔍 Para verificar o status:', 'cyan');
          log(`  curl https://${API_URL}/api/events?limit=1 -H "x-organization-id: ${ORG_ID}"`, 'cyan');
          
        } catch (e) {
          log(`📄 Resposta: ${body}`, 'yellow');
        }
      } else {
        log(`\n❌ Erro ao enviar webhook: ${res.statusCode}`, 'red');
        log(`📄 Resposta: ${body}`, 'red');
      }
    });
  });
  
  req.on('error', (error) => {
    log(`\n❌ Erro na requisição: ${error.message}`, 'red');
  });
  
  req.write(data);
  req.end();
}

// Executar
log('🧪 Teste de Webhook PIX_EXPIRED', 'bright');
log('================================', 'bright');
sendWebhook(); 