const axios = require('axios');

const webhookData = {
  event: 'SALE_REFUSED',
  transaction_id: 'TRX789012',
  order_number: 'ORD456789',
  payment_method: 'Cartão de Crédito',
  refusal_reason: 'Saldo insuficiente',
  refusal_code: 'NSF',
  amount: 'R$ 497,00',
  customer: {
    name: 'Carlos Santos',
    email: 'nicolas.fer.oli@gmail.com', // Email real para teste
    phone_number: '5511987654321',
    document: '12345678901'
  },
  product: {
    id: 'curso-002',
    name: 'Curso de Marketing Digital Avançado',
    price: 'R$ 497,00',
    offer_id: 'black-friday-2024',
    offer_name: 'Black Friday 70% OFF'
  },
  checkout_url: 'https://pay.kirvano.com/checkout/TRX789012',
  utm: {
    utm_source: 'instagram',
    utm_medium: 'stories',
    utm_campaign: 'black-friday',
    utm_content: 'story-3'
  }
};

async function testSaleRefused() {
  try {
    console.log('Enviando webhook SALE_REFUSED...');
    
    const response = await axios.post(
      'http://localhost:4000/webhook/test-org-123',
      webhookData,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-signature': 'test-signature',
          'x-force-immediate': 'true' // Forçar envio imediato para teste
        }
      }
    );

    console.log('✅ Webhook enviado com sucesso!');
    console.log('Response:', response.data);
    
    console.log('\n📧 Verifique seu email em alguns segundos...');
    console.log('Foram agendados 2 emails:');
    console.log('1. Email imediato: Tentativa de recuperação rápida');
    console.log('2. Email após 6h: Suporte personalizado (forçado para imediato no teste)');
    
  } catch (error) {
    console.error('❌ Erro ao enviar webhook:', error.response?.data || error.message);
  }
}

testSaleRefused(); 