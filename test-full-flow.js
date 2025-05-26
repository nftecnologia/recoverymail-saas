const axios = require('axios');

async function testFullFlow() {
  const webhookUrl = 'http://localhost:4000/webhook/test-org-123';
  
  const payload = {
    event: 'ABANDONED_CART',
    checkout_id: 'TEST-' + Date.now(),
    checkout_url: 'https://checkout.exemplo.com/recovery/abc123',
    total_price: 'R$ 497,00',
    customer: {
      name: 'Nicolas Oliveira',
      email: 'nicolas.fer.oli@gmail.com', // Seu email real para receber o teste
      phone_number: '5511999999999'
    },
    products: [
      {
        name: 'Curso de Marketing Digital Avançado',
        price: 'R$ 497,00',
        quantity: 1,
        image_url: 'https://via.placeholder.com/150'
      }
    ],
    store: {
      name: 'Escola Digital Pro',
      domain: 'escoladigital.com.br'
    }
  };

  try {
    console.log('📤 Enviando webhook de teste...');
    const response = await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': 'test-signature'
      }
    });

    console.log('✅ Webhook enviado com sucesso!');
    console.log('📧 Verifique seu email em:');
    console.log('   - 2 horas (primeiro lembrete)');
    console.log('   - 24 horas (urgência)');
    console.log('   - 72 horas (desconto)');
    console.log('\n📊 Acompanhe no dashboard: http://localhost:3000');
    
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao enviar webhook:', error.response?.data || error.message);
  }
}

// Executar teste
testFullFlow(); 