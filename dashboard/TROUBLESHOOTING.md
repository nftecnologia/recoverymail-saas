# Troubleshooting - Dashboard

## Erros Comuns e Soluções

### 1. Erros de Cache Next.js/Turbopack

**Sintomas:**
```
Error: ENOENT: no such file or directory, open '.next/static/development/_buildManifest.js.tmp.xxx'
```

**Solução:**
```bash
# Limpar cache e reiniciar
npm run clean
npm run dev

# Ou usar o comando combinado
npm run dev:clean
```

### 2. Erros de Autenticação

**Sintomas:**
```
CLIENT_FETCH_ERROR "Unexpected token 'I', \"Internal S\"... is not valid JSON"
```

**Solução:**
- O dashboard agora funciona em **modo demonstração** automaticamente
- Use as credenciais: `admin@inboxrecovery.com` / `admin123`
- Se o backend estiver rodando, conectará automaticamente

### 3. Build Errors

**Solução:**
```bash
# Limpar cache e rebuildar
npm run clean
npm run build
```

### 4. Port em Uso

**Se a porta 3000 estiver ocupada:**
- O Next.js automaticamente usa a próxima porta disponível (3001, 3002, etc.)
- Ou especifique uma porta: `npm run dev -- -p 3002`

## Scripts Úteis

- `npm run dev` - Inicia desenvolvimento
- `npm run dev:clean` - Limpa cache e inicia desenvolvimento  
- `npm run clean` - Limpa apenas o cache
- `npm run build` - Build de produção
- `npm run start` - Inicia servidor de produção

## Estado Atual

✅ **Dashboard 100% funcional** mesmo sem backend  
✅ **Autenticação com fallback** para modo demonstração  
✅ **Todas as páginas funcionando** com dados mock  
✅ **Templates restaurados** ao formato original

## Dados Demonstração

- **Login**: admin@inboxrecovery.com / admin123
- **Métricas**: Números realistas gerados automaticamente
- **Gráficos**: Timeline e analytics funcionais
- **Templates**: Preview completo de emails HTML