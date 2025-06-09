# 🚀 **SETUP RÁPIDO DO BANCO DE DADOS**

## ⚠️ **PROBLEMA IDENTIFICADO**
O servidor não consegue conectar ao banco porque a `DATABASE_URL` está configurada com valores de exemplo.

## 🎯 **SOLUÇÃO RÁPIDA (2 minutos)**

### **OPÇÃO A: Neon PostgreSQL (Recomendado - Produção)**

1. **Criar conta gratuita no Neon:**
   ```
   https://neon.tech
   ```

2. **Criar novo projeto:**
   - Nome: `recovery-saas`
   - Região: `US East (Virginia)` ou mais próximo do Brasil
   - PostgreSQL version: `16` (mais recente)

3. **Copiar connection string:**
   ```
   Exemplo: postgresql://neondb_owner:abc123def@ep-example-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

4. **Atualizar backend/.env:**
   ```bash
   # Substituir a linha DATABASE_URL=
   DATABASE_URL="sua_url_real_aqui"
   ```

### **OPÇÃO B: SQLite Local (Teste Rápido)**

Para testes locais imediatos, podemos usar SQLite:

1. **Atualizar backend/.env:**
   ```bash
   DATABASE_URL="file:./dev.db"
   ```

2. **Atualizar schema.prisma temporariamente:**
   ```prisma
   generator client {
     provider = "prisma-client-js"
   }

   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

## 🛠️ **EXECUTAR MIGRATIONS**

Após configurar o banco:

```bash
cd backend

# Gerar cliente Prisma
npm run prisma:generate

# Executar migrations
npm run prisma:migrate

# (Opcional) Popular dados iniciais
npm run seed
```

## 🚀 **TESTAR CONEXÃO**

```bash
# Reiniciar servidor
npm run dev

# Deve mostrar:
# ✅ Database connected successfully
# 🚀 Server running on port 4000
```

## 📝 **SCRIPTS ÚTEIS**

```bash
# Ver banco de dados
npm run prisma:studio

# Reset completo do banco
npm run prisma:reset

# Ver status das migrations
npm run prisma:status
```

---

## 🔗 **URLs IMPORTANTES**

- **Neon Console**: https://console.neon.tech
- **Prisma Studio**: http://localhost:5555 (após `npm run prisma:studio`)

## ⚡ **PRÓXIMO PASSO**

Após configurar o banco e reiniciar o servidor:

```bash
# Executar testes
node test-system-complete.js
```

**Status esperado**: ✅ Database connected successfully
