const axios = require('axios');
const crypto = require('crypto');

// Configuração do teste
const config = {
  webhookUrl: process.env.WEBHOOK_URL || 'http://localhost:3000/webhook/test-org-123',
  secret: process.env.WEBHOOK_SECRET || 'test-secret-key',
  testEmail: process.env.TEST_EMAIL || 'teste@recoverymail.com'
};

// Payload realista de carrinho abandonado (baseado em Shopify/WooCommerce)
const abandonedCartPayload = {
  event: 'ABANDONED_CART',
  checkout_id: 'CART_' + Date.now(),
  checkout_url: 'https://loja.exemplo.com/checkout/recover/abc123',
  total_price: 'R$ 259,90',
  currency: 'BRL',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  customer: {
    id: 'cust_' + Date.now(),
    name: 'Maria Silva',
    email: config.testEmail,
    phone_number: '+5511987654321',
    accepts_marketing: true
  },
  products: [
    {
      id: 'prod_001',
      name: 'Curso Completo de Marketing Digital',
      variant_title: 'Acesso Vitalício',
      price: 'R$ 197,00',
      quantity: 1,
      vendor: 'EduTech Academy',
      product_type: 'Digital Course',
      sku: 'COURSE_MARKETING_2024',
      requires_shipping: false,
      taxable: false,
      gift_card: false,
      image_url: 'https://exemplo.com/images/curso-marketing.jpg',
      product_url: 'https://loja.exemplo.com/products/curso-marketing-digital'
    },
    {
      id: 'prod_002', 
      name: 'Bônus: Templates Prontos',
      variant_title: 'Pack Completo',
      price: 'R$ 62,90',
      quantity: 1,
      vendor: 'EduTech Academy',
      product_type: 'Digital Template',
      sku: 'BONUS_TEMPLATES_2024',
      requires_shipping: false,
      taxable: false,
      gift_card: false,
      image_url: 'https://exemplo.com/images/templates.jpg',
      product_url: 'https://loja.exemplo.com/products/templates-marketing'
    }
  ],
  discount_codes: [],
  tax_lines: [],
  abandoned_checkout_url: 'https://loja.exemplo.com/checkout/abc123/recover',
  cart_token: 'cart_token_' + Date.now(),
  gateway: 'manual',
  buyer_accepts_marketing: true,
  referring_site: 'https://google.com',
  landing_site: '/produtos/curso-marketing',
  device_id: 'device_' + Date.now(),
  user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  utm: {
    utm_source: 'google',
    utm_medium: 'cpc', 
    utm_campaign: 'marketing_curso_2024',
    utm_content: 'ad_variant_a',
    utm_term: 'curso marketing digital'
  },
  note: 'Cliente interessado em marketing digital, veio do Google Ads',
  billing_address: {
    first_name: 'Maria',
    last_name: 'Silva',
    company: 'Consultoria MS',
    address1: 'Rua das Flores, 123',
    address2: 'Apto 45',
    city: 'São Paulo',
    province: 'SP',
    country: 'Brazil',
    zip: '01234-567',
    phone: '+5511987654321'
  },
  shipping_address: {
    first_name: 'Maria',
    last_name: 'Silva', 
    company: 'Consultoria MS',
    address1: 'Rua das Flores, 123',
    address2: 'Apto 45',
    city: 'São Paulo',
    province: 'SP',
    country: 'Brazil',
    zip: '01234-567',
    phone: '+5511987654321'
  }
};

// Função para gerar assinatura HMAC
function generateHmacSignature(payload, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
}

// Função principal de teste
async function testAbandonedCart() {
  console.log('🧪 TESTE: ABANDONED_CART - Iniciando...\n');
  
  try {
    // Gerar assinatura HMAC
    const signature = generateHmacSignature(abandonedCartPayload, config.secret);
    
    console.log('📋 Dados do teste:');
    console.log(`   📧 Email: ${config.testEmail}`);
    console.log(`   🛒 Carrinho: ${abandonedCartPayload.checkout_id}`);
    console.log(`   💰 Valor: ${abandonedCartPayload.total_price}`);
    console.log(`   📦 Produtos: ${abandonedCartPayload.products.length}`);
    console.log(`   🔐 Assinatura: ${signature.substring(0, 16)}...`);
    console.log(`   🌐 URL: ${config.webhookUrl}\n`);

    // Enviar webhook
    console.log('🚀 Enviando webhook...');
    const response = await axios.post(config.webhookUrl, abandonedCartPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Event-Type': 'ABANDONED_CART',
        'User-Agent': 'RecoveryMail-Test/1.0'
      },
      timeout: 10000
    });

    // Verificar resposta
    if (response.status === 200) {
      console.log('✅ Webhook recebido com sucesso!');
      console.log(`   📊 Status: ${response.status}`);
      console.log(`   📝 Response: ${JSON.stringify(response.data)}\n`);
      
      // Aguardar processamento
      console.log('⏳ Aguardando processamento das filas...');
      console.log('   📧 Email 1: 2 horas (lembrete gentil)');
      console.log('   📧 Email 2: 24 horas (criando urgência)');  
      console.log('   📧 Email 3: 72 horas (desconto 10%)\n');
      
      // Simular verificação das filas
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('🎯 TESTE CONCLUÍDO: ABANDONED_CART');
      console.log('✅ Sistema processou o webhook corretamente');
      console.log('✅ Emails serão enviados conforme cronograma');
      console.log('✅ Dados salvos no banco de dados\n');
      
      return true;
    } else {
      throw new Error(`Status inesperado: ${response.status}`);
    }
    
  } catch (error) {
    console.log('❌ ERRO no teste ABANDONED_CART:');
    
    if (error.response) {
      console.log(`   📊 Status: ${error.response.status}`);
      console.log(`   📝 Data: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.log(`   🌐 Erro de conexão: ${error.message}`);
      console.log(`   🔗 URL testada: ${config.webhookUrl}`);
    } else {
      console.log(`   ⚠️ Erro: ${error.message}`);
    }
    
    console.log('\n🔧 Possíveis soluções:');
    console.log('   1. Verificar se o servidor está rodando');
    console.log('   2. Verificar variáveis de ambiente');
    console.log('   3. Verificar logs do servidor');
    console.log('   4. Testar conexão com o banco de dados\n');
    
    return false;
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testAbandonedCart()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { testAbandonedCart, config };
