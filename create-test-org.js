// Script para criar organização de teste via API
const axios = require('axios');

async function createTestOrg() {
  try {
    // Primeiro, vamos tentar fazer login como admin (se houver endpoint)
    // Por enquanto, vamos usar o webhook diretamente para testar
    
    console.log('🔍 Testando se a organização test-org já existe...');
    
    const testWebhook = await axios.post(
      'https://recoverymail.onrender.com/webhook/test-org',
      {
        event: 'TEST',
        customer: { email: 'test@example.com' }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': 'test'
        },
        validateStatus: () => true // Aceitar qualquer status
      }
    );
    
    if (testWebhook.status === 404 || (testWebhook.data && testWebhook.data.error && testWebhook.data.error.message === 'Organization not found')) {
      console.log('❌ Organização não existe');
      console.log('\n📝 Para criar a organização, você precisa:');
      console.log('1. Acessar o banco de dados Neon diretamente');
      console.log('2. Executar o SQL em backend/create-test-org.sql');
      console.log('3. Ou aguardar o deploy do endpoint /api/setup/create-test-org');
    } else {
      console.log('✅ Organização test-org já existe!');
      console.log('\n🚀 Você pode enviar webhooks para:');
      console.log('https://recoverymail.onrender.com/webhook/test-org');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

createTestOrg(); 