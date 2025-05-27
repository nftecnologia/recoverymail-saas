#!/usr/bin/env node

// Script para criar organização de teste e verificar sistema

const API_URL = process.env.API_URL || 'https://recoverymail.onrender.com';

async function createTestOrg() {
  console.log('🏢 Criando organização de teste...\n');

  try {
    // 1. Criar organização
    const orgRes = await fetch(`${API_URL}/api/setup/organization`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Organization',
        domain: 'test.example.com'
      })
    });

    if (!orgRes.ok) {
      const error = await orgRes.text();
      console.error('❌ Erro ao criar organização:', error);
      return;
    }

    const org = await orgRes.json();
    console.log('✅ Organização criada!');
    console.log('   ID:', org.id);
    console.log('   API Key:', org.apiKey);
    console.log('   Webhook Secret:', org.webhookSecret);
    console.log('   Webhook URL:', `${API_URL}/webhook/${org.id}`);

    // 2. Verificar sistema
    console.log('\n🔍 Verificando sistema...');
    
    // Health check
    const healthRes = await fetch(`${API_URL}/health`);
    const health = await healthRes.json();
    console.log('   Health:', health.status);
    
    // Redis check
    const redisRes = await fetch(`${API_URL}/api/test-redis`);
    if (redisRes.ok) {
      const redis = await redisRes.json();
      console.log('   Redis:', redis.redis);
      console.log('   Jobs na fila:', JSON.stringify(redis.jobs));
    }

    console.log('\n✅ Sistema configurado e pronto para uso!');
    console.log('\n📝 Salve estas informações:');
    console.log('----------------------------');
    console.log(`Organization ID: ${org.id}`);
    console.log(`API Key: ${org.apiKey}`);
    console.log(`Webhook Secret: ${org.webhookSecret}`);
    console.log(`Webhook URL: ${API_URL}/webhook/${org.id}`);
    console.log('----------------------------');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

// Executar
createTestOrg(); 