#!/usr/bin/env node

const API_URL = 'https://recoverymail.onrender.com';
const ORG_ID = 'test-org-123';
const WEBHOOK_SECRET = 'test-webhook-secret-123';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testFullFlow() {
  console.log('🔍 Testando fluxo completo do Recovery Mail...\n');

  // 1. Verificar saúde do sistema
  console.log('1️⃣ Verificando saúde do sistema...');
  const healthRes = await fetch(`${API_URL}/health`);
  const health = await healthRes.json();
  console.log('   Status:', health.status);
  console.log('   Database:', health.services.database);
  
  if (health.status !== 'healthy') {
    console.error('❌ Sistema não está saudável!');
    return;
  }

  // 2. Verificar métricas antes
  console.log('\n2️⃣ Métricas ANTES do teste:');
  const metricsBeforeRes = await fetch(`${API_URL}/api/dashboard/metrics`, {
    headers: { 'x-organization-id': ORG_ID }
  });
  const metricsBefore = await metricsBeforeRes.json();
  console.log('   Total eventos:', metricsBefore.totalEvents);
  console.log('   Eventos processados:', metricsBefore.processedEvents);
  console.log('   Taxa de processamento:', metricsBefore.processingRate + '%');
  console.log('   Total emails:', metricsBefore.totalEmails);

  // 3. Enviar webhook de teste
  console.log('\n3️⃣ Enviando webhook de teste...');
  const webhookData = {
    event: "ABANDONED_CART",
    checkout_id: `TEST-${Date.now()}`,
    checkout_url: "https://exemplo.com/checkout/teste",
    total_price: "R$ 297,00",
    customer: {
      name: "Teste Diagnóstico",
      email: "nicolas.fer.oli@gmail.com", // Use seu email real aqui
      phone_number: "5511999999999"
    },
    products: [{
      name: "Produto de Teste",
      price: "R$ 297,00"
    }]
  };

  const webhookRes = await fetch(`${API_URL}/webhook/${ORG_ID}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': WEBHOOK_SECRET
    },
    body: JSON.stringify(webhookData)
  });

  const webhookResult = await webhookRes.json();
  console.log('   Resposta:', webhookResult.message);
  console.log('   Event ID:', webhookResult.eventId);

  // 4. Aguardar processamento
  console.log('\n4️⃣ Aguardando processamento (30 segundos)...');
  for (let i = 0; i < 6; i++) {
    await sleep(5000);
    process.stdout.write('.');
  }
  console.log('');

  // 5. Verificar status do evento
  console.log('\n5️⃣ Verificando status do evento...');
  const eventsRes = await fetch(`${API_URL}/api/events?limit=1`, {
    headers: { 'x-organization-id': ORG_ID }
  });
  const events = await eventsRes.json();
  const lastEvent = events.events[0];
  
  if (lastEvent) {
    console.log('   ID:', lastEvent.id);
    console.log('   Tipo:', lastEvent.eventType);
    console.log('   Status:', lastEvent.status);
    console.log('   Processado em:', lastEvent.processedAt || 'NÃO PROCESSADO');
    console.log('   Erro:', lastEvent.error || 'Nenhum');
  }

  // 6. Verificar emails enviados
  console.log('\n6️⃣ Verificando emails...');
  const emailsRes = await fetch(`${API_URL}/api/emails?limit=5`, {
    headers: { 'x-organization-id': ORG_ID }
  });
  const emails = await emailsRes.json();
  
  console.log('   Total de emails encontrados:', emails.emails.length);
  if (emails.emails.length > 0) {
    const lastEmail = emails.emails[0];
    console.log('   Último email:');
    console.log('     - Para:', lastEmail.to);
    console.log('     - Assunto:', lastEmail.subject);
    console.log('     - Status:', lastEmail.status);
    console.log('     - Enviado em:', lastEmail.sentAt || 'NÃO ENVIADO');
  }

  // 7. Verificar métricas depois
  console.log('\n7️⃣ Métricas DEPOIS do teste:');
  const metricsAfterRes = await fetch(`${API_URL}/api/dashboard/metrics`, {
    headers: { 'x-organization-id': ORG_ID }
  });
  const metricsAfter = await metricsAfterRes.json();
  console.log('   Total eventos:', metricsAfter.totalEvents, `(+${metricsAfter.totalEvents - metricsBefore.totalEvents})`);
  console.log('   Eventos processados:', metricsAfter.processedEvents, `(+${metricsAfter.processedEvents - metricsBefore.processedEvents})`);
  console.log('   Taxa de processamento:', metricsAfter.processingRate + '%');
  console.log('   Total emails:', metricsAfter.totalEmails, `(+${metricsAfter.totalEmails - metricsBefore.totalEmails})`);

  // Diagnóstico
  console.log('\n📊 DIAGNÓSTICO:');
  if (lastEvent && lastEvent.status === 'PENDING') {
    console.log('❌ PROBLEMA: Eventos não estão sendo processados!');
    console.log('   Possíveis causas:');
    console.log('   - Worker de email não está rodando');
    console.log('   - Redis não está conectado');
    console.log('   - Erro no processamento das filas');
  } else if (lastEvent && lastEvent.status === 'PROCESSED') {
    console.log('✅ Eventos estão sendo processados corretamente!');
    
    if (emails.emails.length === 0 || emails.emails[0].status === 'PENDING') {
      console.log('❌ PROBLEMA: Emails não estão sendo enviados!');
      console.log('   Possíveis causas:');
      console.log('   - Resend API key inválida');
      console.log('   - Erro no template de email');
    } else {
      console.log('✅ Sistema funcionando perfeitamente!');
    }
  }
}

// Executar teste
testFullFlow().catch(console.error); 