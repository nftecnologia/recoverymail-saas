/**
 * Script para testar webhook no formato Kirvano (plataforma de infoprodutos)
 */
const axios = require('axios');
const crypto = require('crypto');

// Configurações
const API_URL = process.env.API_URL || 'http://localhost:4000';
const ORG_ID = process.env.ORG_ID || 'test-org-123';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'test-secret-123';

// Payload exato como a Kirvano envia (baseado na documentação)
const kirvanoPayload = {
  event: "BANK_SLIP_EXPIRED",
  event_description: "Boleto expirado",
  checkout_id: "Q8J1N6K3",
  checkout_url: "http://localhost:3001/recovery/e0d5f16c-cdd0-4ec8-acdc-aec411510a5f",
  sale_id: "D2RP8RQ7",
  payment_method: "BANK_SLIP",
  total_price: "R$ 997,00", // Valor típico de infoproduto
  type: "ONE_TIME",
  status: "CANCELED",
  created_at: new Date().toISOString(),
  customer: {
    name: "Maria Silva",
    document: "23875090127",
    email: "maria.silva@gmail.com",
    phone_number: "5511999887766"
  },
  payment: {
    method: "BANK_SLIP",
    link: "http://localhost:3030/bankslip/cc7a4fa0-fba1-4527-8793-077307c666a4/download",
    digitable_line: "30282023186900000000500000179044184750000099700",
    barcode: "30281847500000997002023169000000000000017904",
    expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Expirou ontem
  },
  products: [
    {
      id: "0a5e54b1-f91f-49b3-9a6e-699f9732040b",
      name: "Método 6 em 7 - Do Zero aos Primeiros Mil",
      offer_id: "3224dbb7-123d-463e-8e8c-041bfcbf6e12",
      offer_name: "Oferta Especial Black Friday",
      description: "O método validado que já ajudou mais de 5.000 pessoas a criar seu primeiro negócio online",
      price: "R$ 497,00",
      photo: "https://s3.amazonaws.com/infoprodutor/metodo-6em7-cover.jpg",
      is_order_bump: false
    },
    {
      id: "99636030-ef58-47d6-9785-be068f888ad9",
      name: "Pack de Ferramentas Premium",
      offer_id: "a4d56451-4155-431b-9ece-2c1d85e035c7",
      offer_name: "Order Bump Irresistível",
      description: "Templates, checklists e planilhas que aceleram seus resultados em 10x",
      price: "R$ 197,00",
      photo: "https://s3.amazonaws.com/infoprodutor/pack-ferramentas.jpg",
      is_order_bump: true
    }
  ],
  utm: {
    src: "instagram",
    utm_source: "stories",
    utm_medium: "social",
    utm_campaign: "lancamento-janeiro",
    utm_term: "avatar-ideal",
    utm_content: "video-vsl-curta"
  }
};

// Função para calcular HMAC
function calculateHMAC(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}

// Enviar webhook
async function sendWebhook() {
  try {
    const signature = calculateHMAC(kirvanoPayload, WEBHOOK_SECRET);
    
    console.log('📤 Enviando webhook Kirvano para:', `${API_URL}/webhook/${ORG_ID}`);
    console.log('📦 Evento:', kirvanoPayload.event);
    console.log('💰 Valor total:', kirvanoPayload.total_price);
    console.log('📧 Cliente:', kirvanoPayload.customer.email);
    console.log('🏷️ Produtos:', kirvanoPayload.products.map(p => p.name).join(', '));
    console.log('📊 UTM Campaign:', kirvanoPayload.utm.utm_campaign);
    
    const response = await axios.post(
      `${API_URL}/webhook/${ORG_ID}`,
      kirvanoPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Force-Immediate': 'true' // Para teste imediato
        }
      }
    );
    
    console.log('\n✅ Webhook enviado com sucesso!');
    console.log('📨 Resposta:', response.data);
    
    // Informações sobre recuperação
    console.log('\n💡 Estratégia de Recuperação:');
    console.log('- Email 1 (30min): Oferecer novo boleto + PIX com desconto');
    console.log('- Email 2 (24h): Escassez - vagas limitadas + depoimentos');
    console.log('- Email 3 (48h): Última chance + bônus exclusivo');
    
  } catch (error) {
    console.error('\n❌ Erro ao enviar webhook:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

// Testar também carrinho abandonado
async function sendAbandonedCart() {
  const abandonedPayload = {
    event: "ABANDONED_CART",
    checkout_id: "CART123",
    checkout_url: "https://pay.kirvano.com/checkout/CART123",
    total_price: "R$ 1.297,00",
    customer: {
      name: "João Pedro",
      email: "joao.pedro@gmail.com",
      phone_number: "5521998765432"
    },
    products: [
      {
        id: "curso-001",
        name: "Curso Completo de Copy para Vendas",
        offer_id: "black-week-2024",
        offer_name: "Black Week Especial",
        description: "Aprenda a escrever copies que vendem milhões",
        price: "R$ 997,00",
        photo: "https://exemplo.com/curso-copy.jpg",
        is_order_bump: false
      },
      {
        id: "bonus-001",
        name: "Mentoria em Grupo - 3 meses",
        offer_id: "bonus-exclusivo",
        offer_name: "Bônus por Tempo Limitado",
        price: "R$ 300,00",
        is_order_bump: true
      }
    ],
    utm: {
      utm_source: "youtube",
      utm_medium: "video",
      utm_campaign: "lancamento-copy",
      utm_content: "aula-gratuita-1"
    }
  };

  try {
    const signature = calculateHMAC(abandonedPayload, WEBHOOK_SECRET);
    
    console.log('\n\n📤 Enviando ABANDONED_CART...');
    
    const response = await axios.post(
      `${API_URL}/webhook/${ORG_ID}`,
      abandonedPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
        }
      }
    );
    
    console.log('✅ Carrinho abandonado registrado!');
    console.log('📨 Resposta:', response.data);
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

// Executar testes
async function runTests() {
  console.log('🚀 Testando integração com webhooks estilo Kirvano\n');
  
  // Teste 1: Boleto expirado
  await sendWebhook();
  
  // Aguardar 2 segundos
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Teste 2: Carrinho abandonado
  await sendAbandonedCart();
  
  console.log('\n✨ Testes concluídos!');
  console.log('\n📌 Próximos passos:');
  console.log('1. Verificar emails enviados: node check-email-tracking.js');
  console.log('2. Ver status das filas: node check-queue-status.js');
  console.log('3. Configurar webhook real na Kirvano com a URL do ngrok');
}

runTests(); 