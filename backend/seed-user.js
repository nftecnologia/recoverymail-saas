const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔐 Criando usuário admin...');

    // Hash da senha
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Criar usuário e organização em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // Criar usuário
      const user = await tx.user.create({
        data: {
          name: 'Admin Recovery',
          email: 'admin@inboxrecovery.com',
          password: hashedPassword,
          role: 'ADMIN',
          isVerified: true,
          isActive: true
        }
      });

      // Buscar organização existente ou criar nova
      let organization = await tx.organization.findFirst({
        where: { id: 'test-org-123' }
      });

      if (!organization) {
        organization = await tx.organization.create({
          data: {
            id: 'test-org-123',
            name: 'Inbox Recovery Admin',
            apiKey: `sk_admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            plan: 'PRO'
          }
        });
      }

      // Relacionar usuário com organização como OWNER
      await tx.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: 'OWNER',
          permissions: ['ALL']
        }
      });

      return { user, organization };
    });

    console.log('✅ Usuário admin criado com sucesso!');
    console.log('📧 Email:', result.user.email);
    console.log('🔑 Senha: admin123');
    console.log('🏢 Organização:', result.organization.name);
    console.log('🔗 API Key:', result.organization.apiKey);
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    if (error.code === 'P2002') {
      console.log('ℹ️  Usuário já existe! Use as credenciais existentes.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();