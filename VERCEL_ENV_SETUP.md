# Configuração de Variáveis de Ambiente na Vercel

## Passo a Passo

1. **Acesse o Dashboard da Vercel**
   - Vá para https://vercel.com/dashboard
   - Selecione o projeto `recoverymail`

2. **Navegue até Settings → Environment Variables**
   - Clique na aba "Settings" no topo
   - No menu lateral, clique em "Environment Variables"

3. **Adicione as seguintes variáveis:**

### NEXTAUTH_URL
- **Key**: `NEXTAUTH_URL`
- **Value**: `https://seu-dominio.vercel.app` (substitua pelo seu domínio real)
- **Environment**: Production, Preview, Development

### NEXTAUTH_SECRET
- **Key**: `NEXTAUTH_SECRET`
- **Value**: `Zalp5KYm0Od0pclwWssbg/XVTFKs7OJ8ojKMhD4pDmM=`
- **Environment**: Production, Preview, Development

### NEXT_PUBLIC_API_URL
- **Key**: `NEXT_PUBLIC_API_URL`
- **Value**: `https://sua-api.railway.app` (ou onde seu backend estiver hospedado)
- **Environment**: Production, Preview, Development

4. **Clique em "Save" para cada variável**

5. **Faça um novo deploy**
   - Após adicionar todas as variáveis, você precisa fazer um novo deploy
   - Vá para a aba "Deployments"
   - Clique nos três pontos do último deploy
   - Selecione "Redeploy"

## Credenciais de Login

Após configurar as variáveis de ambiente, use estas credenciais:

- **Email**: `admin@inboxrecovery.com`
- **Senha**: `admin123`

## Importante

- O `NEXTAUTH_URL` deve ser a URL completa do seu site na Vercel (ex: https://recoverymail.vercel.app)
- Não inclua barra (/) no final da URL
- O `NEXTAUTH_SECRET` deve ser mantido em segredo e nunca compartilhado publicamente
- Se você ainda não tem um backend rodando, pode deixar `NEXT_PUBLIC_API_URL` como `http://localhost:4000` temporariamente

## Verificando se funcionou

1. Acesse sua aplicação na Vercel
2. Vá para a página de login
3. Use as credenciais acima
4. Se houver erro, verifique os logs em Vercel → Functions → Logs 