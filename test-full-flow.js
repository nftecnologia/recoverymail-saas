#!/usr/bin/env node

const https = require('https');

// Configurações
const API_URL = 'api.inboxrecovery.com';
const ORG_ID = 'test-org-123';
const TEST_EMAIL = 'nicolas.fer.oli@gmail.com'; // Seu email para receber o teste

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Função para fazer requisições HTTPS
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testFullFlow() {
  log('\n🚀 TESTE DE FLUXO COMPLETO - RECOVERY MAIL\n', 'bright');
  
  try {
    // 1. Verificar saúde da API
    log('1️⃣  Verificando saúde da API...', 'yellow');
    const healthCheck = await makeRequest({
      hostname: API_URL,
      path: '/health',
      method: 'GET'
    });
    
    if (healthCheck.data.status === 'healthy') {
      log('✅ API está saudável!', 'green');
    } else {
      throw new Error('API não está saudável');
    }

    // 2. Buscar métricas iniciais
    log('\n2️⃣  Buscando métricas iniciais...', 'yellow');
    const initialMetrics = await makeRequest({
      hostname: API_URL,
      path: '/api/dashboard/metrics',
      method: 'GET',
      headers: {
        'x-organization-id': ORG_ID
      }
    });
    
    log(`📊 Métricas atuais:`, 'blue');
    log(`   - Total de eventos: ${initialMetrics.data.totalEvents}`);
    log(`   - Emails enviados: ${initialMetrics.data.sentEmails}`);
    log(`   - Taxa de abertura: ${initialMetrics.data.openRate}%`);
    log(`   - Taxa de cliques: ${initialMetrics.data.clickRate}%`);

    // 3. Enviar webhook de carrinho abandonado
    log('\n3️⃣  Enviando webhook de carrinho abandonado...', 'yellow');
    const timestamp = Date.now();
    const checkoutId = `FLOW-TEST-${timestamp}`;
    
    const webhookPayload = {
      event: 'ABANDONED_CART',
      checkout_id: checkoutId,
      checkout_url: 'https://example.com/checkout/' + checkoutId,
      total_price: 'R$ 499,90',
      customer: {
        name: 'Teste Fluxo Completo',
        email: TEST_EMAIL,
        phone_number: '5511999999999'
      },
      products: [
        {
          name: 'Produto Premium - Teste Completo',
          price: 'R$ 399,90',
          quantity: 1,
          image_url: 'https://via.placeholder.com/200'
        },
        {
          name: 'Produto Adicional',
          price: 'R$ 100,00',
          quantity: 1,
          image_url: 'https://via.placeholder.com/200'
        }
      ]
    };

    const webhookResponse = await makeRequest({
      hostname: API_URL,
      path: `/webhook/${ORG_ID}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, webhookPayload);

    if (webhookResponse.status === 200) {
      log(`✅ Webhook enviado com sucesso!`, 'green');
      log(`   Event ID: ${webhookResponse.data.eventId}`, 'blue');
    } else {
      throw new Error(`Erro ao enviar webhook: ${webhookResponse.status}`);
    }

    // 4. Aguardar processamento
    log('\n4️⃣  Aguardando processamento do webhook...', 'yellow');
    log('   ⏳ Aguardando 5 segundos para o worker processar...', 'blue');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 5. Verificar se o evento foi processado
    log('\n5️⃣  Verificando status do evento...', 'yellow');
    const eventsResponse = await makeRequest({
      hostname: API_URL,
      path: `/api/events?limit=1`,
      method: 'GET',
      headers: {
        'x-organization-id': ORG_ID
      }
    });

    const latestEvent = eventsResponse.data.events[0];
    if (latestEvent && latestEvent.externalId === checkoutId) {
      log(`✅ Evento encontrado!`, 'green');
      log(`   Status: ${latestEvent.status}`, 'blue');
      log(`   Tipo: ${latestEvent.eventType}`, 'blue');
    }

    // 6. Verificar emails enviados
    log('\n6️⃣  Verificando emails enviados...', 'yellow');
    const emailsResponse = await makeRequest({
      hostname: API_URL,
      path: `/api/emails?limit=5`,
      method: 'GET',
      headers: {
        'x-organization-id': ORG_ID
      }
    });

    const recentEmails = emailsResponse.data.emails.filter(email => 
      email.to === TEST_EMAIL && 
      new Date(email.createdAt).getTime() > Date.now() - 60000 // Últimos 60 segundos
    );

    if (recentEmails.length > 0) {
      log(`✅ Email(s) encontrado(s)!`, 'green');
      recentEmails.forEach((email, index) => {
        log(`\n   📧 Email ${index + 1}:`, 'blue');
        log(`      Para: ${email.to}`);
        log(`      Assunto: ${email.subject}`);
        log(`      Status: ${email.status}`);
        log(`      Template: ${email.template}`);
        if (email.sentAt) {
          log(`      Enviado em: ${new Date(email.sentAt).toLocaleString('pt-BR')}`);
        }
      });
    } else {
      log(`⚠️  Nenhum email encontrado para ${TEST_EMAIL} nos últimos 60 segundos`, 'yellow');
    }

    // 7. Métricas finais
    log('\n7️⃣  Buscando métricas atualizadas...', 'yellow');
    const finalMetrics = await makeRequest({
      hostname: API_URL,
      path: '/api/dashboard/metrics',
      method: 'GET',
      headers: {
        'x-organization-id': ORG_ID
      }
    });

    log(`\n📊 Comparação de métricas:`, 'bright');
    log(`   Total de eventos: ${initialMetrics.data.totalEvents} → ${finalMetrics.data.totalEvents} (+${finalMetrics.data.totalEvents - initialMetrics.data.totalEvents})`, 'green');
    log(`   Emails enviados: ${initialMetrics.data.sentEmails} → ${finalMetrics.data.sentEmails} (+${finalMetrics.data.sentEmails - initialMetrics.data.sentEmails})`, 'green');

    // Instruções finais
    log('\n📌 PRÓXIMOS PASSOS:', 'bright');
    log(`\n1. Verifique seu email (${TEST_EMAIL}) para o email de carrinho abandonado`, 'yellow');
    log('2. Abra o email para registrar o evento de abertura', 'yellow');
    log('3. Clique em algum link do email para registrar o evento de clique', 'yellow');
    log('4. Acesse o dashboard em https://recoverymail.vercel.app/events para ver os eventos', 'yellow');
    log('5. Os eventos de tracking (opened/clicked) aparecerão em tempo real', 'yellow');

    log('\n✅ TESTE DE FLUXO COMPLETO FINALIZADO!\n', 'green');

  } catch (error) {
    log(`\n❌ Erro durante o teste: ${error.message}`, 'red');
    console.error(error);
  }
}

// Executar o teste
testFullFlow(); 