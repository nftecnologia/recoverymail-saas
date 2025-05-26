// Script para testar webhook de boleto expirado
const axios = require('axios');
const crypto = require('crypto');

// Configurações
const API_URL = process.env.API_URL || 'http://localhost:4000';
const ORG_ID = process.env.ORG_ID || 'test-org-123';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'test-secret-123';

// Payload do webhook BANK_SLIP_EXPIRED
const payload = {
  event: 'BANK_SLIP_EXPIRED',
  transaction_id: `BOL-${Date.now()}`,
  bank_slip_url: 'https://loja.exemplo.com/boleto/23791.23456.78901.234567.89012.345678.9.87654321000150',
  bank_slip_code: '23791.23456.78901.234567.89012.345678.9.87654321000150',
  total_price: 'R$ 359,90',
  customer: {
    name: 'Carlos Oliveira',
    email: 'carlos.oliveira@exemplo.com',
    phone_number: '11988776655'
  },
  expired_at: new Date().toISOString(),
  checkout_url: 'https://loja.exemplo.com/payment/boleto/regenerate/abc456'
};

// Gerar assinatura HMAC
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(JSON.stringify(payload))
  .digest('hex');

// Enviar webhook
async function sendWebhook() {
  try {
    console.log('📤 Enviando webhook BANK_SLIP_EXPIRED...');
    console.log('URL:', `${API_URL}/webhook/${ORG_ID}`);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const response = await axios.post(
      `${API_URL}/webhook/${ORG_ID}`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': `sha256=${signature}`
        }
      }
    );

    console.log('\n✅ Webhook enviado com sucesso!');
    console.log('Response:', response.data);
    console.log('\n📧 Emails agendados:');
    console.log('- Email 1: Em 30 minutos (gerar novo boleto)');
    console.log('- Email 2: Em 24 horas (sugerir PIX)');
    console.log('- Email 3: Em 48 horas (desconto de 5%)');
  } catch (error) {
    console.error('\n❌ Erro ao enviar webhook:');
    console.error(error.response?.data || error.message);
  }
}

sendWebhook(); 