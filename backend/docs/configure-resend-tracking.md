# Configurar Tracking de Abertura e Cliques no Resend

## ⚠️ IMPORTANTE: Tracking deve ser habilitado no Dashboard

O tracking de abertura e cliques **NÃO funciona apenas com headers na API**. Você precisa habilitar no dashboard do Resend primeiro!

## 📋 Passo a Passo

### 1. Acessar o Dashboard do Resend
1. Acesse [app.resend.com](https://app.resend.com)
2. Faça login com sua conta

### 2. Configurar o Domínio
1. No menu lateral, clique em **Domains**
2. Selecione o domínio `resend.dev` (ou seu domínio customizado)
3. Procure pela seção **"Configuration"**

### 3. Habilitar Tracking
1. Na seção Configuration, você verá duas opções:
   - **Open tracking** - Rastreia quando o email é aberto
   - **Click tracking** - Rastreia quando links são clicados
2. **Ative ambas as opções**
3. Salve as configurações

## 🔧 Como Funciona

### Open Tracking
- O Resend insere um pixel transparente de 1x1 no final do email
- Quando o email é aberto e as imagens são carregadas, o pixel é requisitado
- Isso dispara o webhook `email.opened`

### Click Tracking
- O Resend reescreve todos os links do email para passar por seus servidores
- Exemplo: `https://seu-site.com` vira `https://link.resend.com/xxx`
- Quando clicado, o usuário é redirecionado instantaneamente
- Isso dispara o webhook `email.clicked` com detalhes do clique

## 🐛 Troubleshooting

### Email aberto mas não registra
1. **Bloqueador de imagens**: Muitos clientes de email bloqueiam imagens por padrão
2. **Gmail**: Pode cachear imagens, afetando o tracking
3. **Preview pane**: Alguns clientes não carregam imagens no preview

### Links não clicáveis
1. Verifique se o template está gerando HTML válido
2. Confirme que os links têm `href` correto
3. Teste com diferentes clientes de email

## 📊 Verificar no Código

Nosso sistema já está preparado para receber os webhooks:

```javascript
// backend/src/routes/resend-webhook.routes.ts
case 'email.opened':
  // Atualiza openedAt no banco
  
case 'email.clicked':
  // Atualiza clickedAt no banco
  // Registra detalhes do clique (link, IP, user agent)
```

## 🔄 Próximos Passos

1. **Habilite o tracking no dashboard do Resend**
2. **Aguarde alguns minutos** para a configuração propagar
3. **Envie um novo email de teste**
4. **Abra o email e clique em um link**
5. **Verifique com**: `node check-email-tracking.js`

## 📝 Notas Importantes

- O tracking só funciona para emails enviados **APÓS** habilitar a configuração
- Emails antigos não terão tracking retroativo
- Alguns provedores (empresa/corporativo) podem bloquear tracking por política de segurança
- O tracking respeita privacidade - usuários podem bloquear se desejarem 