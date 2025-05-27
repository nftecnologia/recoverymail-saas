# Informações de Login - Recovery Mail Dashboard

## Credenciais de Acesso

Para acessar o dashboard, use as seguintes credenciais:

- **Email**: `admin@inboxrecovery.com`
- **Senha**: `admin123`

## Configuração Necessária

Para o login funcionar corretamente, você precisa criar um arquivo `.env.local` na pasta `dashboard/` com o seguinte conteúdo:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua-chave-secreta-super-segura-aqui-32-caracteres

# API Backend
NEXT_PUBLIC_API_URL=http://localhost:4000

# Ambiente
NODE_ENV=development
```

### Gerando NEXTAUTH_SECRET

Para gerar uma chave segura para NEXTAUTH_SECRET, execute:

```bash
openssl rand -base64 32
```

## Solução de Problemas

### 1. Erro "NEXTAUTH_URL is not set"
- Certifique-se de que o arquivo `.env.local` existe
- Reinicie o servidor de desenvolvimento após criar o arquivo

### 2. Erro de credenciais inválidas
- Verifique se está usando o email correto: `admin@inboxrecovery.com`
- A senha é case-sensitive: `admin123`

### 3. Erro 500 no login
- Verifique se o NEXTAUTH_SECRET está configurado
- O NEXTAUTH_SECRET deve ter pelo menos 32 caracteres

## Como executar

1. Crie o arquivo `.env.local` com as variáveis acima
2. Instale as dependências:
   ```bash
   cd dashboard
   npm install
   ```
3. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. Acesse http://localhost:3000/login
5. Use as credenciais fornecidas acima

## Observações

- Este é um usuário de demonstração hardcoded para desenvolvimento
- Em produção, os usuários devem ser armazenados em um banco de dados
- A senha está hasheada usando bcrypt 