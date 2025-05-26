// Script para testar webhook de tracking do Resend
const axios = require('axios');
const crypto = require('crypto');

// Configurações
const WEBHOOK_URL = 'http://localhost:4000/resend-webhook';
const WEBHOOK_SECRET = 'whsec_6dBO8wxbUc4AJJ7PB9HkM4EdFYN1gvxj';

// Função para gerar assinatura
function generateSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('base64');
}

// Testar evento de email aberto
async function testEmailOpened() {
  const payload = {
    type: 'email.opened',
    created_at: new Date().toISOString(),
    data: {
      email_id: 'msg_test_opened_123',
      from: 'recovery@inboxrecovery.com',
      to: ['joao.silva@exemplo.com'],
      subject: 'Você esqueceu alguns itens especiais'
    }
  };

  const signature = generateSignature(payload, WEBHOOK_SECRET);

  try {
    console.log('📧 Enviando evento de email ABERTO...');
    const response = await axios.post(WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'resend-signature': signature
      }
    });
    console.log('✅ Resposta:', response.data);
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

// Testar evento de link clicado
async function testLinkClicked() {
  const payload = {
    type: 'email.clicked',
    created_at: new Date().toISOString(),
    data: {
      email_id: 'msg_test_clicked_456',
      from: 'recovery@inboxrecovery.com',
      to: ['maria.santos@exemplo.com'],
      subject: 'Seu PIX está expirando!',
      click: {
        link: 'https://loja.exemplo.com/checkout/recovery/xyz123',
        timestamp: Math.floor(Date.now() / 1000),
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)',
        ip_address: '200.150.100.50'
      }
    }
  };

  const signature = generateSignature(payload, WEBHOOK_SECRET);

  try {
    console.log('\n🖱️  Enviando evento de link CLICADO...');
    const response = await axios.post(WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'resend-signature': signature
      }
    });
    console.log('✅ Resposta:', response.data);
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

// Executar testes
async function runTests() {
  console.log('🧪 Testando webhooks de tracking do Resend\n');
  
  // Primeiro, precisamos ter emails no banco
  console.log('⚠️  IMPORTANTE: Este teste assume que você já tem emails enviados no banco.');
  console.log('   Se não tiver, execute primeiro os scripts test-webhook.js\n');
  
  await testEmailOpened();
  await new Promise(resolve => setTimeout(resolve, 1000));
  await testLinkClicked();
  
  console.log('\n📊 Execute "node check-email-tracking.js" para ver as estatísticas atualizadas!');
}

runTests(); 