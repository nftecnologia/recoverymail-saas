// Script para testar webhook de PIX expirado
const axios = require('axios');
const crypto = require('crypto');

// Configurações
const API_URL = process.env.API_URL || 'http://localhost:4000';
const ORG_ID = process.env.ORG_ID || 'test-org-123';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'test-secret-123';

// Payload do webhook PIX_EXPIRED
const payload = {
  event: 'PIX_EXPIRED',
  transaction_id: `PIX-${Date.now()}`,
  pix_qr_code: '00020126330014BR.GOV.BCB.PIX0111119876543215204000053039865802BR5913LOJA EXEMPLO6009SAO PAULO62070503***6304B3C8',
  pix_copy_paste: '00020126330014BR.GOV.BCB.PIX0111119876543215204000053039865802BR5913LOJA EXEMPLO6009SAO PAULO62070503***6304B3C8',
  total_price: 'R$ 149,90',
  customer: {
    name: 'Maria Santos',
    email: 'maria.santos@exemplo.com',
    phone_number: '11999887766'
  },
  expired_at: new Date().toISOString(),
  checkout_url: 'https://loja.exemplo.com/payment/pix/regenerate/xyz789'
};

// Gerar assinatura HMAC
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(JSON.stringify(payload))
  .digest('hex');

// Enviar webhook
async function sendWebhook() {
  try {
    console.log('📤 Enviando webhook PIX_EXPIRED...');
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
    console.log('- Email 1: Em 15 minutos (renovação urgente)');
    console.log('- Email 2: Em 2 horas (última chance)');
  } catch (error) {
    console.error('\n❌ Erro ao enviar webhook:');
    console.error(error.response?.data || error.message);
  }
}

sendWebhook(); 