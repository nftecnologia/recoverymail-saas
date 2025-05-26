// Script para testar webhook com envio IMEDIATO de email
const axios = require('axios');
const crypto = require('crypto');

// Configurações
const API_URL = process.env.API_URL || 'http://localhost:4000';
const ORG_ID = process.env.ORG_ID || 'test-org-123';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'test-secret-123';

// Email de destino - ALTERE PARA SEU EMAIL REAL!
const YOUR_EMAIL = process.env.TEST_EMAIL || 'nicolas.fer.oli@gmail.com';
const YOUR_NAME = process.env.TEST_NAME || 'Nicolas';

// Payload do webhook
const payload = {
  event: 'ABANDONED_CART',
  checkout_id: `URGENT-${Date.now()}`,
  checkout_url: 'https://loja.exemplo.com/checkout/recover/test123',
  total_price: 'R$ 199,90',
  customer: {
    name: YOUR_NAME,
    email: YOUR_EMAIL,
    phone_number: '11999887766'
  },
  products: [
    {
      name: 'Produto Teste para Tracking',
      price: 'R$ 199,90',
      quantity: 1,
      image_url: 'https://via.placeholder.com/200'
    }
  ],
  abandoned_at: new Date().toISOString()
};

// Gerar assinatura HMAC
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(JSON.stringify(payload))
  .digest('hex');

// Enviar webhook
async function sendWebhook() {
  try {
    console.log('📤 Enviando webhook com DELAY ZERO...');
    console.log(`📧 Email será enviado para: ${YOUR_EMAIL}`);
    console.log('URL:', `${API_URL}/webhook/${ORG_ID}`);
    
    const response = await axios.post(
      `${API_URL}/webhook/${ORG_ID}`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': `sha256=${signature}`,
          // Header especial para forçar envio imediato
          'X-Force-Immediate': 'true'
        }
      }
    );

    console.log('\n✅ Webhook enviado com sucesso!');
    console.log('Response:', response.data);
    console.log('\n⏱️  AGUARDE: O email deve ser enviado em poucos segundos...');
    console.log('\n📨 PRÓXIMOS PASSOS:');
    console.log('1. Verifique sua caixa de entrada');
    console.log('2. Abra o email');
    console.log('3. Clique em algum link');
    console.log('4. Execute: node check-email-tracking.js');
    
  } catch (error) {
    console.error('\n❌ Erro ao enviar webhook:');
    console.error(error.response?.data || error.message);
  }
}

// Verificar email
if (YOUR_EMAIL === 'seu-email-real@gmail.com') {
  console.log('\n⚠️  ATENÇÃO: Configure seu email real!');
  console.log('Execute: TEST_EMAIL=seu@email.com node test-webhook-immediate.js');
  console.log('Ou edite a variável YOUR_EMAIL neste arquivo.\n');
  process.exit(1);
}

sendWebhook(); 