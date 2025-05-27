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

// Gerar dados do boleto
const bankSlipData = {
  event: 'BANK_SLIP_EXPIRED',
  transaction_id: `TRX-${Date.now()}`,
  sale_id: `SALE-${Date.now()}`,
  bank_slip_url: 'https://exemplo.com/boleto/123456789',
  bank_slip_code: '34191.79001 01043.510047 91020.150008 1 91540000019990',
  total_price: 'R$ 297,00',
  expired_at: new Date().toISOString(),
  checkout_url: 'https://loja.exemplo.com/checkout/boleto-vencido',
  payment_method: 'BANK_SLIP',
  type: 'ONE_TIME',
  status: 'expired',
  created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias atrás
  customer: {
    name: 'Teste Boleto Vencido',
    email: TEST_EMAIL,
    phone_number: '5511999999999',
    document: '12345678900'
  },
  products: [
    {
      id: 'PROD-001',
      name: 'Curso Completo de Marketing Digital',
      price: 'R$ 297,00',
      quantity: 1,
      image_url: 'https://via.placeholder.com/200x200?text=Marketing',
      offer_id: 'OFFER-MKT-001',
      offer_name: 'Oferta Especial Black Friday'
    }
  ],
  payment: {
    method: 'BANK_SLIP',
    link: 'https://exemplo.com/boleto/123456789',
    digitable_line: '34191.79001 01043.510047 91020.150008 1 91540000019990',
    barcode: '34191915400000199901790001043510047910201500',
    expires_at: new Date().toISOString()
  },
  utm: {
    utm_source: 'facebook',
    utm_medium: 'cpc',
    utm_campaign: 'black_friday_2024'
  }
};

// Função para fazer a requisição
function sendWebhook() {
  const data = JSON.stringify(bankSlipData);
  
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

  log('\n🚀 Enviando webhook BANK_SLIP_EXPIRED...', 'bright');
  log(`📍 URL: https://${API_URL}/webhook/${ORG_ID}`, 'cyan');
  log(`📧 Email: ${TEST_EMAIL}`, 'cyan');
  log(`💰 Valor: ${bankSlipData.total_price}`, 'cyan');
  log(`📄 Código: ${bankSlipData.bank_slip_code.substring(0, 20)}...`, 'cyan');

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
          log(`📊 Status: ${response.status || 'PENDING'}`, 'green');
          
          log('\n📧 Emails programados:', 'yellow');
          log('  1️⃣  Em 30 minutos: "⚠️ Seu boleto expirou - Gere um novo agora"', 'yellow');
          log('  2️⃣  Em 24 horas: "🔥 Ainda dá tempo! PIX com desconto exclusivo"', 'yellow');
          log('  3️⃣  Em 48 horas: "😢 Última chance com oferta especial"', 'yellow');
          
          log('\n💡 Dicas:', 'blue');
          log('  - Verifique seu email em 30 minutos', 'blue');
          log('  - O segundo email oferece PIX como alternativa', 'blue');
          log('  - O terceiro email tem 10% de desconto', 'blue');
          
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
log('🧪 Teste de Webhook BANK_SLIP_EXPIRED', 'bright');
log('=====================================', 'bright');
sendWebhook(); 