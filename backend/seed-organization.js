const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Criar organização de teste
    const org = await prisma.organization.create({
      data: {
        id: 'test-org-123',
        name: 'Loja Teste',
        domain: 'loja-teste.com.br',
        webhookSecret: 'test-secret-123',
        apiKey: 'test-api-key-123',
        emailSettings: {
          replyTo: 'suporte@loja-teste.com.br',
          includeUnsubscribe: true,
        },
      },
    });

    console.log('✅ Organização criada com sucesso!');
    console.log('ID:', org.id);
    console.log('Nome:', org.name);
    console.log('\n📝 Use este ID para enviar webhooks:');
    console.log(`POST http://localhost:4000/webhook/${org.id}`);
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  Organização já existe no banco de dados');
      console.log('\n📝 Use o ID para enviar webhooks:');
      console.log('POST http://localhost:4000/webhook/test-org-123');
    } else {
      console.error('❌ Erro ao criar organização:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main(); 