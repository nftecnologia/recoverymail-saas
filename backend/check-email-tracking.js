/**
 * Script para verificar o status de rastreamento dos emails
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEmailTracking() {
  try {
    console.log('🔍 Verificando status de rastreamento de emails...\n');

    // Buscar todos os logs de email
    const emailLogs = await prisma.emailLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    if (emailLogs.length === 0) {
      console.log('Nenhum email encontrado.');
      return;
    }

    // Agrupar por status
    const statusCounts = emailLogs.reduce((acc, log) => {
      acc[log.status] = (acc[log.status] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Resumo de Status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} emails`);
    });
    console.log('');

    // Listar emails com detalhes
    console.log('📧 Últimos 20 emails:\n');
    emailLogs.forEach((log, index) => {
      console.log(`${index + 1}. Email para: ${log.to}`);
      console.log(`   Template: ${log.template}`);
      console.log(`   Status: ${log.status}`);
      console.log(`   Enviado: ${log.sentAt ? log.sentAt.toLocaleString('pt-BR') : 'Não enviado'}`);
      
      if (log.openedAt) {
        console.log(`   ✅ Aberto em: ${log.openedAt.toLocaleString('pt-BR')}`);
      }
      
      if (log.clickedAt) {
        console.log(`   🖱️  Clicado em: ${log.clickedAt.toLocaleString('pt-BR')}`);
      }
      
      if (log.error) {
        console.log(`   ❌ Erro: ${log.error}`);
      }
      
      console.log('');
    });

    // Estatísticas de engajamento
    const totalSent = emailLogs.filter(log => log.status !== 'PENDING' && log.status !== 'FAILED').length;
    const totalOpened = emailLogs.filter(log => log.openedAt).length;
    const totalClicked = emailLogs.filter(log => log.clickedAt).length;

    if (totalSent > 0) {
      console.log('📈 Taxa de Engajamento:');
      console.log(`   Taxa de abertura: ${((totalOpened / totalSent) * 100).toFixed(1)}%`);
      console.log(`   Taxa de cliques: ${((totalClicked / totalSent) * 100).toFixed(1)}%`);
    }

  } catch (error) {
    console.error('❌ Erro ao verificar tracking:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmailTracking(); 