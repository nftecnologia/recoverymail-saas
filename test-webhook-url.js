const https = require('https');

const API_URL = 'api.inboxrecovery.com';
const ORG_ID = 'test-org-123';

// Função para fazer requisição HTTPS
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function testWebhookUrl() {
  console.log('🔍 Testando geração de URL do webhook...\n');
  
  try {
    // 1. Buscar configurações da organização
    console.log('1️⃣ Buscando configurações da organização...');
    const settingsResponse = await makeRequest({
      hostname: API_URL,
      path: '/api/settings',
      method: 'GET',
      headers: {
        'x-organization-id': ORG_ID
      }
    });
    
    if (settingsResponse.status === 200) {
      const { organization } = settingsResponse.data;
      console.log('✅ Configurações obtidas com sucesso!');
      console.log(`   - Nome: ${organization.name}`);
      console.log(`   - ID: ${organization.id}`);
      console.log(`   - Webhook URL: ${organization.webhookUrl}`);
      console.log(`   - Webhook Secret: ${organization.webhookSecret}`);
      
      // Verificar se a URL está correta
      const expectedUrl = `https://${API_URL}/webhook/${ORG_ID}`;
      if (organization.webhookUrl === expectedUrl) {
        console.log('\n✅ URL do webhook está correta!');
      } else {
        console.log('\n❌ URL do webhook está incorreta!');
        console.log(`   Esperado: ${expectedUrl}`);
        console.log(`   Recebido: ${organization.webhookUrl}`);
      }
      
      // 2. Testar o endpoint do webhook
      console.log('\n2️⃣ Testando endpoint do webhook...');
      const webhookPath = `/webhook/${ORG_ID}`;
      console.log(`   URL: https://${API_URL}${webhookPath}`);
      
      const testPayload = {
        event: 'TEST_EVENT',
        timestamp: new Date().toISOString(),
        data: {
          message: 'Teste de webhook'
        }
      };
      
      const webhookResponse = await makeRequest({
        hostname: API_URL,
        path: webhookPath,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-signature': 'test-signature'
        }
      }, JSON.stringify(testPayload));
      
      console.log(`   Status: ${webhookResponse.status}`);
      if (webhookResponse.status === 200 || webhookResponse.status === 201) {
        console.log('✅ Webhook endpoint está funcionando!');
      } else {
        console.log('❌ Webhook endpoint retornou erro');
        console.log('   Resposta:', webhookResponse.data);
      }
      
    } else {
      console.log('❌ Erro ao buscar configurações:', settingsResponse.status);
      console.log('   Resposta:', settingsResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
  
  console.log('\n📝 Instruções para o usuário:');
  console.log('1. Configure seu sistema para enviar webhooks para:');
  console.log(`   https://${API_URL}/webhook/${ORG_ID}`);
  console.log('\n2. Use o webhook secret para validar as requisições:');
  console.log('   (disponível nas configurações da organização)');
  console.log('\n3. Teste com diferentes tipos de evento:');
  console.log('   - ABANDONED_CART');
  console.log('   - PIX_EXPIRED');
  console.log('   - BANK_SLIP_EXPIRED');
  console.log('   - etc.');
}

// Executar teste
testWebhookUrl(); 