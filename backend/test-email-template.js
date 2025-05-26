/**
 * Script para testar o template de email localmente
 */
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

// Dados de teste
const testData = {
  customerName: 'Nicolas',
  customerEmail: 'nicolas.fer.oli@gmail.com',
  checkoutUrl: 'https://loja.exemplo.com/checkout/recover/test123',
  totalPrice: 'R$ 199,90',
  products: [
    {
      name: 'Produto Teste para Tracking',
      price: 'R$ 199,90',
      quantity: 1,
      image_url: 'https://via.placeholder.com/200'
    }
  ],
  organizationName: 'Loja Teste',
  domain: 'loja-teste.com',
  attemptNumber: 1
};

// Carregar template
const templatePath = path.join(__dirname, 'src/templates/emails/abandoned-cart-reminder.hbs');
const templateContent = fs.readFileSync(templatePath, 'utf-8');

// Compilar template
const template = handlebars.compile(templateContent);

// Gerar HTML
const html = template(testData);

// Salvar HTML para visualização
const outputPath = path.join(__dirname, 'test-email-output.html');
fs.writeFileSync(outputPath, html);

console.log('✅ Template compilado com sucesso!');
console.log(`📄 HTML salvo em: ${outputPath}`);
console.log('\n📊 Verificações:');

// Verificar se o link está presente
if (html.includes(testData.checkoutUrl)) {
  console.log('✅ URL do checkout encontrada no HTML');
} else {
  console.log('❌ URL do checkout NÃO encontrada no HTML');
}

// Verificar se o botão tem href correto
const buttonRegex = /<a[^>]*href="([^"]*)"[^>]*class="cta-button"/;
const match = html.match(buttonRegex);
if (match) {
  console.log(`✅ Botão com href: ${match[1]}`);
} else {
  console.log('❌ Botão CTA não encontrado ou sem href');
}

// Verificar outros elementos
console.log(`✅ Nome do cliente: ${html.includes(testData.customerName) ? 'Presente' : 'Ausente'}`);
console.log(`✅ Email do cliente: ${html.includes(testData.customerEmail) ? 'Presente' : 'Ausente'}`);
console.log(`✅ Valor total: ${html.includes(testData.totalPrice) ? 'Presente' : 'Ausente'}`);

console.log('\n💡 Abra o arquivo HTML no navegador para visualizar o email!'); 