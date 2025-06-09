const axios = require('axios');
const { testAbandonedCart } = require('./test-abandoned-cart-complete');
const { testSaleRefused } = require('./test-sale-refused-complete');

// Configuração global dos testes
const config = {
  webhookUrl: process.env.WEBHOOK_URL || 'http://localhost:4000/webhook/test-org-123',
  apiUrl: process.env.API_URL || 'http://localhost:4000/api',
  secret: process.env.WEBHOOK_SECRET || 'test-secret-key',
  testEmail: process.env.TEST_EMAIL || 'teste@recoverymail.com',
  orgId: process.env.TEST_ORG_ID || 'test-org-123'
};

// Cores para output mais visual
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log(`\n${colors.bold}${colors.cyan}${'='.repeat(60)}`);
  console.log(`${colors.bold}${colors.cyan}${message}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

// Teste das APIs do Dashboard
async function testDashboardAPIs() {
  logHeader('🧪 TESTE: DASHBOARD APIs');
  
  const tests = [
    {
      name: 'Métricas Dashboard',
      endpoint: '/dashboard/metrics?organizationId=test-org-123',
      expectedFields: ['success', 'data']
    },
    {
      name: 'Lista de Eventos',
      endpoint: '/dashboard/events?organizationId=test-org-123&page=1&limit=10',
      expectedFields: ['success', 'data']
    },
    {
      name: 'Lista de Emails',
      endpoint: '/dashboard/emails?organizationId=test-org-123&page=1&limit=10', 
      expectedFields: ['success', 'data']
    }
  ];

  const results = [];
  
  for (const test of tests) {
    try {
      log('blue', `🔍 Testando: ${test.name}`);
      console.log(`   🌐 URL: ${config.apiUrl}${test.endpoint}`);
      
      const response = await axios.get(`${config.apiUrl}${test.endpoint}`, {
        timeout: 5000,
        headers: {
          'Authorization': `Bearer test-token`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200) {
        const data = response.data;
        const missingFields = test.expectedFields.filter(field => !(field in data));
        
        if (missingFields.length === 0) {
          log('green', `   ✅ ${test.name}: PASSOU`);
          console.log(`   📊 Dados recebidos: ${Object.keys(data).join(', ')}`);
          results.push({ test: test.name, status: 'PASS', data });
        } else {
          log('yellow', `   ⚠️ ${test.name}: CAMPOS FALTANDO`);
          console.log(`   ❌ Campos ausentes: ${missingFields.join(', ')}`);
          results.push({ test: test.name, status: 'PARTIAL', missingFields });
        }
      } else {
        throw new Error(`Status HTTP: ${response.status}`);
      }
      
    } catch (error) {
      log('red', `   ❌ ${test.name}: FALHOU`);
      if (error.response) {
        console.log(`   📊 Status: ${error.response.status}`);
        console.log(`   📝 Erro: ${error.response.data?.message || 'Erro desconhecido'}`);
      } else {
        console.log(`   🌐 Erro: ${error.message}`);
      }
      results.push({ test: test.name, status: 'FAIL', error: error.message });
    }
    
    console.log(''); // Linha em branco
  }
  
  return results;
}

// Teste de PIX Expired (crítico no Brasil)
async function testPixExpired() {
  logHeader('🧪 TESTE: PIX_EXPIRED');
  
  const pixExpiredPayload = {
    event: 'PIX_EXPIRED',
    transaction_id: 'PIX_' + Date.now(),
    pix_id: 'PIX_' + Date.now(),
    expired_at: new Date().toISOString(),
    amount: 'R$ 89,90',
    expiration_time: '30 minutos',
    customer: {
      name: 'Ana Costa',
      email: config.testEmail,
      phone_number: '+5511988776655'
    },
    pix_qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    pix_copy_paste: '00020101021126580014BR.GOV.BCB.PIX0136123e4567-e12b-12d1-a456-42665544000052040000530398654041.235802BR5925NOME DO RECEBEDOR6009SAO PAULO61080123456762190515RP12345678-20196304A9A0',
    new_pix_url: 'https://loja.exemplo.com/checkout/new-pix/abc123',
    utm: {
      utm_source: 'whatsapp',
      utm_medium: 'social',
      utm_campaign: 'pix_promo'
    }
  };
  
  try {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', config.secret);
    hmac.update(JSON.stringify(pixExpiredPayload));
    const signature = hmac.digest('hex');
    
    log('blue', '🚀 Enviando webhook PIX_EXPIRED...');
    console.log(`   ⚡ PIX ID: ${pixExpiredPayload.pix_id}`);
    console.log(`   💰 Valor: ${pixExpiredPayload.amount}`);
    console.log(`   📧 Email: ${config.testEmail}`);
    
    const response = await axios.post(config.webhookUrl, pixExpiredPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Event-Type': 'PIX_EXPIRED'
      },
      timeout: 10000
    });
    
    if (response.status === 200) {
      log('green', '✅ PIX_EXPIRED: Webhook aceito!');
      console.log('   📧 Email 1: 15 minutos (gerar novo PIX)');
      console.log('   📧 Email 2: 2 horas (última chance)');
      console.log('   💡 Foco: Urgência e facilidade de pagamento\n');
      return true;
    }
    
  } catch (error) {
    log('red', '❌ PIX_EXPIRED: Falhou');
    console.log(`   Erro: ${error.message}\n`);
    return false;
  }
}

// Teste de Subscription Canceled (win-back)
async function testSubscriptionCanceled() {
  logHeader('🧪 TESTE: SUBSCRIPTION_CANCELED');
  
  const subscriptionPayload = {
    event: 'SUBSCRIPTION_CANCELED',
    subscription_id: 'SUB_' + Date.now(),
    canceled_at: new Date().toISOString(),
    plan_name: 'Plano Premium',
    plan_price: 'R$ 97,00',
    billing_cycle: 'MONTHLY',
    customer: {
      name: 'Carlos Ferreira',
      email: config.testEmail,
      total_paid: 'R$ 485,00',
      subscription_start_date: '2024-01-15'
    },
    cancellation: {
      reason: 'PRICE',
      canceled_by: 'CUSTOMER',
      effective_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    win_back_offer: {
      discount_percent: 30,
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  };
  
  try {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', config.secret);
    hmac.update(JSON.stringify(subscriptionPayload));
    const signature = hmac.digest('hex');
    
    log('blue', '🚀 Enviando webhook SUBSCRIPTION_CANCELED...');
    console.log(`   👤 Cliente: ${subscriptionPayload.customer.name}`);
    console.log(`   💰 Total pago: ${subscriptionPayload.customer.total_paid}`);
    console.log(`   ❌ Motivo: ${subscriptionPayload.cancellation.reason}`);
    
    const response = await axios.post(config.webhookUrl, subscriptionPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Event-Type': 'SUBSCRIPTION_CANCELED'
      },
      timeout: 10000
    });
    
    if (response.status === 200) {
      log('green', '✅ SUBSCRIPTION_CANCELED: Webhook aceito!');
      console.log('   📧 Email 1: Imediato (confirmação + feedback)');
      console.log('   📧 Email 2: 7 dias (30% desconto win-back)');
      console.log('   📧 Email 3: 30 dias (50% desconto final)');
      console.log('   💡 Estratégia: Win-back baseado no motivo\n');
      return true;
    }
    
  } catch (error) {
    log('red', '❌ SUBSCRIPTION_CANCELED: Falhou');
    console.log(`   Erro: ${error.message}\n`);
    return false;
  }
}

// Função principal que executa todos os testes
async function runAllTests() {
  console.log(`${colors.bold}${colors.magenta}`);
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║              🧪 RECOVERY SAAS - TESTE COMPLETO           ║');
  console.log('║                    VALIDAÇÃO DO SISTEMA                  ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}\n`);
  
  console.log(`${colors.bold}📋 Configuração dos testes:${colors.reset}`);
  console.log(`   🌐 Webhook URL: ${config.webhookUrl}`);
  console.log(`   🔗 API URL: ${config.apiUrl}`);
  console.log(`   📧 Email teste: ${config.testEmail}`);
  console.log(`   🏢 Org ID: ${config.orgId}\n`);
  
  const results = {
    webhooks: [],
    apis: [],
    summary: { total: 0, passed: 0, failed: 0 }
  };
  
  // Teste 1: APIs do Dashboard
  try {
    const apiResults = await testDashboardAPIs();
    results.apis = apiResults;
    
    const apiPassed = apiResults.filter(r => r.status === 'PASS').length;
    const apiPartial = apiResults.filter(r => r.status === 'PARTIAL').length;
    const apiFailed = apiResults.filter(r => r.status === 'FAIL').length;
    
    log('cyan', `📊 APIs Dashboard: ${apiPassed} passaram, ${apiPartial} parciais, ${apiFailed} falharam`);
  } catch (error) {
    log('red', `❌ Erro nos testes de API: ${error.message}`);
  }
  
  // Teste 2: Webhooks principais
  console.log(''); // Linha em branco
  
  const webhookTests = [
    { name: 'ABANDONED_CART', test: testAbandonedCart },
    { name: 'SALE_REFUSED', test: testSaleRefused },
    { name: 'PIX_EXPIRED', test: testPixExpired },
    { name: 'SUBSCRIPTION_CANCELED', test: testSubscriptionCanceled }
  ];
  
  for (const webhookTest of webhookTests) {
    try {
      const result = await webhookTest.test();
      results.webhooks.push({ name: webhookTest.name, status: result ? 'PASS' : 'FAIL' });
      results.summary.total++;
      if (result) results.summary.passed++;
      else results.summary.failed++;
    } catch (error) {
      log('red', `❌ Erro no teste ${webhookTest.name}: ${error.message}`);
      results.webhooks.push({ name: webhookTest.name, status: 'ERROR', error: error.message });
      results.summary.total++;
      results.summary.failed++;
    }
  }
  
  // Resumo final
  logHeader('📊 RESUMO DOS TESTES');
  
  console.log(`${colors.bold}🎯 WEBHOOKS TESTADOS:${colors.reset}`);
  results.webhooks.forEach(webhook => {
    const icon = webhook.status === 'PASS' ? '✅' : webhook.status === 'FAIL' ? '❌' : '⚠️';
    const color = webhook.status === 'PASS' ? 'green' : webhook.status === 'FAIL' ? 'red' : 'yellow';
    log(color, `   ${icon} ${webhook.name}: ${webhook.status}`);
  });
  
  console.log(`\n${colors.bold}🔗 APIs TESTADAS:${colors.reset}`);
  results.apis.forEach(api => {
    const icon = api.status === 'PASS' ? '✅' : api.status === 'PARTIAL' ? '⚠️' : '❌';
    const color = api.status === 'PASS' ? 'green' : api.status === 'PARTIAL' ? 'yellow' : 'red';
    log(color, `   ${icon} ${api.test}: ${api.status}`);
  });
  
  console.log(`\n${colors.bold}📈 ESTATÍSTICAS:${colors.reset}`);
  console.log(`   🎯 Total de testes: ${results.summary.total}`);
  log('green', `   ✅ Passaram: ${results.summary.passed}`);
  log('red', `   ❌ Falharam: ${results.summary.failed}`);
  
  const successRate = (results.summary.passed / results.summary.total * 100).toFixed(1);
  if (successRate >= 80) {
    log('green', `   🏆 Taxa de sucesso: ${successRate}% - EXCELENTE!`);
  } else if (successRate >= 60) {
    log('yellow', `   ⚠️ Taxa de sucesso: ${successRate}% - MELHORAR`);
  } else {
    log('red', `   🚨 Taxa de sucesso: ${successRate}% - CRÍTICO`);
  }
  
  console.log(`\n${colors.bold}🚀 PRÓXIMOS PASSOS:${colors.reset}`);
  if (successRate >= 80) {
    console.log('   ✅ Sistema validado! Pronto para produção');
    console.log('   🎯 Próximo: Frontend Dashboard');
    console.log('   🚀 Próximo: Deploy produção');
  } else {
    console.log('   🔧 Corrigir falhas encontradas');
    console.log('   🧪 Executar testes novamente');
    console.log('   📝 Verificar logs do servidor');
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  return results;
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllTests()
    .then(results => {
      const successRate = results.summary.passed / results.summary.total;
      process.exit(successRate >= 0.8 ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Erro fatal nos testes:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests, config };
