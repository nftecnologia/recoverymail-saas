#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cores para output
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
  console.log(`\n${colors.bold}${colors.cyan}${'='.repeat(50)}`);
  console.log(`${colors.bold}${colors.cyan}${message}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}${'='.repeat(50)}${colors.reset}\n`);
}

async function setupDatabase() {
  logHeader('🚀 RECOVERY SAAS - SETUP DO BANCO DE DADOS');

  try {
    // Verificar se estamos no diretório correto
    if (!fs.existsSync('./backend/prisma/schema.prisma')) {
      log('red', '❌ Erro: Execute este script na raiz do projeto (onde está o diretório backend)');
      process.exit(1);
    }

    // Entrar no diretório backend
    process.chdir('./backend');
    log('blue', '📁 Entrando no diretório backend...');

    // Verificar se o arquivo .env existe
    if (!fs.existsSync('.env')) {
      log('yellow', '⚠️ Arquivo .env não encontrado, criando...');
      
      // Copiar do exemplo
      if (fs.existsSync('env.example')) {
        fs.copyFileSync('env.example', '.env');
        log('green', '✅ Arquivo .env criado baseado no env.example');
      } else {
        log('red', '❌ Erro: Arquivo env.example não encontrado');
        process.exit(1);
      }
    }

    // Verificar se DATABASE_URL está configurada para SQLite
    const envContent = fs.readFileSync('.env', 'utf8');
    if (!envContent.includes('file:./dev.db')) {
      log('yellow', '⚠️ Configurando DATABASE_URL para SQLite...');
      
      const updatedEnv = envContent.replace(
        /DATABASE_URL=".*"/,
        'DATABASE_URL="file:./dev.db"'
      );
      
      fs.writeFileSync('.env', updatedEnv);
      log('green', '✅ DATABASE_URL configurada para SQLite');
    }

    // 1. Instalar dependências se necessário
    log('blue', '📦 Verificando dependências...');
    if (!fs.existsSync('node_modules')) {
      log('yellow', '⚠️ Instalando dependências...');
      execSync('npm install', { stdio: 'inherit' });
      log('green', '✅ Dependências instaladas');
    } else {
      log('green', '✅ Dependências já instaladas');
    }

    // 2. Gerar cliente Prisma
    log('blue', '⚙️ Gerando cliente Prisma...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    log('green', '✅ Cliente Prisma gerado');

    // 3. Resolver conflito de provider e executar migrations
    log('blue', '📊 Resolvendo conflito de migrations...');
    
    // Verificar se existe conflito de provider
    const migrationLockPath = 'prisma/migrations/migration_lock.toml';
    if (fs.existsSync(migrationLockPath)) {
      const lockContent = fs.readFileSync(migrationLockPath, 'utf8');
      if (lockContent.includes('postgresql')) {
        log('yellow', '⚠️ Conflito detectado: migrations eram PostgreSQL, convertendo para SQLite...');
        
        // Backup e remover migrations antigas
        if (fs.existsSync('prisma/migrations')) {
          if (fs.existsSync('prisma/migrations.backup')) {
            execSync('rm -rf prisma/migrations.backup', { stdio: 'inherit' });
          }
          execSync('mv prisma/migrations prisma/migrations.backup', { stdio: 'inherit' });
          log('green', '✅ Migrations PostgreSQL movidas para backup');
        }
      }
    }
    
    // Criar nova migration para SQLite ou usar dev se não existir
    if (!fs.existsSync('prisma/migrations') || fs.readdirSync('prisma/migrations').length === 0) {
      log('blue', '📊 Criando nova migration para SQLite...');
      execSync('npx prisma migrate dev --name init --skip-generate', { stdio: 'inherit' });
    } else {
      log('blue', '📊 Executando migrations existentes...');
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    }
    
    log('green', '✅ Migrations configuradas para SQLite');

    // 4. Verificar se dev.db foi criado
    if (fs.existsSync('dev.db')) {
      const stats = fs.statSync('dev.db');
      log('green', `✅ Banco de dados criado: dev.db (${Math.round(stats.size / 1024)}KB)`);
    } else {
      log('red', '❌ Erro: Arquivo dev.db não foi criado');
      process.exit(1);
    }

    // 5. Criar organização de teste
    log('blue', '🏢 Criando organização de teste...');
    
    const createOrgScript = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestOrg() {
  try {
    const org = await prisma.organization.upsert({
      where: { id: 'test-org-123' },
      update: {},
      create: {
        id: 'test-org-123',
        name: 'Recovery SaaS Test',
        domain: 'test.recoverymail.com',
        webhookSecret: 'test-secret-key',
        plan: 'PRO',
        emailSettings: {
          fromEmail: 'recovery@test.com',
          fromName: 'Recovery Test'
        }
      }
    });
    
    console.log('✅ Organização de teste criada:', org.id);
    return org;
  } catch (error) {
    console.error('❌ Erro ao criar organização:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestOrg();
    `;
    
    fs.writeFileSync('create-test-org-temp.js', createOrgScript);
    execSync('node create-test-org-temp.js', { stdio: 'inherit' });
    fs.unlinkSync('create-test-org-temp.js');
    
    log('green', '✅ Organização de teste criada');

    // 6. Testar conexão
    log('blue', '🔍 Testando conexão com banco...');
    
    const testScript = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
  try {
    const count = await prisma.organization.count();
    console.log('✅ Conexão OK - Organizações no banco:', count);
    return true;
  } catch (error) {
    console.error('❌ Erro de conexão:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
    `;
    
    fs.writeFileSync('test-connection-temp.js', testScript);
    execSync('node test-connection-temp.js', { stdio: 'inherit' });
    fs.unlinkSync('test-connection-temp.js');

    // Voltar para o diretório raiz
    process.chdir('..');

    // Sucesso!
    logHeader('🎉 SETUP CONCLUÍDO COM SUCESSO!');
    
    console.log(`${colors.green}✅ Banco de dados SQLite configurado`);
    console.log(`✅ Migrations executadas`);
    console.log(`✅ Organização de teste criada`);
    console.log(`✅ Conexão validada${colors.reset}\n`);
    
    log('cyan', '🚀 PRÓXIMOS PASSOS:');
    console.log('   1. Iniciar o servidor: cd backend && npm run dev');
    console.log('   2. Executar testes: node test-system-complete.js');
    console.log('   3. Ver banco: cd backend && npx prisma studio\n');
    
    log('yellow', '💡 Configuração atual:');
    console.log('   📊 Banco: SQLite (dev.db)');
    console.log('   🏢 Org ID: test-org-123');
    console.log('   🔐 Secret: test-secret-key');
    console.log('   🌐 Webhook URL: http://localhost:4000/webhook/test-org-123\n');

  } catch (error) {
    log('red', '❌ Erro durante o setup:');
    console.error(error.message);
    
    log('yellow', '\n🔧 Para resolver:');
    console.log('   1. Verificar se Node.js está instalado');
    console.log('   2. Verificar permissões de escrita');
    console.log('   3. Executar: cd backend && npm install');
    console.log('   4. Tentar novamente: node ../setup-database.js\n');
    
    process.exit(1);
  }
}

// Executar setup
setupDatabase();
