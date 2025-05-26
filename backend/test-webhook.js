#!/usr/bin/env node

const axios = require('axios');
const crypto = require('crypto');

// Configurações
const API_URL = process.env.API_URL || 'http://localhost:4000';
const ORG_ID = 'test-org-123'; // Você precisa criar esta organização no banco
const WEBHOOK_SECRET = 'test-secret-123'; // Mesmo secret da organização

// Payload de teste - Carrinho Abandonado
const payload = {
  event: 'ABANDONED_CART',
  checkout_id: 'CHK-' + Date.now(),
  checkout_url: 'https://loja.exemplo.com/checkout/recover/abc123',
  total_price: 'R$ 299,90',
  customer: {
    name: 'João Silva',
    email: 'joao.silva@exemplo.com',
    phone_number: '11987654321'
  },
  products: [
    {
      name: 'Camiseta Premium',
      price: 'R$ 89,90',
      quantity: 2,
      image_url: 'https://exemplo.com/produto1.jpg'
    },
    {
      name: 'Calça Jeans',
      price: 'R$ 120,10',
      quantity: 1,
      image_url: 'https://exemplo.com/produto2.jpg'
    }
  ],
  abandoned_at: new Date().toISOString()
};

// Gerar assinatura HMAC
function generateSignature(payload, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload), 'utf8')
    .digest('hex');
  
  return `sha256=${hash}`;
}

// Enviar webhook
async function sendWebhook() {
  try {
    const signature = generateSignature(payload, WEBHOOK_SECRET);
    
    console.log('📤 Enviando webhook...');
    console.log('URL:', `${API_URL}/webhook/${ORG_ID}`);
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('Signature:', signature);
    
    const response = await axios.post(
      `${API_URL}/webhook/${ORG_ID}`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature
        }
      }
    );
    
    console.log('\n✅ Webhook enviado com sucesso!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('\n❌ Erro ao enviar webhook:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

// Script de setup para criar organização de teste
async function setupTestOrg() {
  console.log('\n🔧 Para testar, você precisa criar uma organização de teste no banco:');
  console.log('\nExecute este SQL no seu banco de dados:\n');
  console.log(`
INSERT INTO "Organization" (id, name, "webhookSecret", "createdAt", "updatedAt")
VALUES ('${ORG_ID}', 'Test Organization', '${WEBHOOK_SECRET}', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET "webhookSecret" = '${WEBHOOK_SECRET}';
  `);
  console.log('\n');
}

// Executar
if (process.argv.includes('--setup')) {
  setupTestOrg();
} else {
  sendWebhook();
} 