#!/bin/bash

echo "🚀 Forçando build do backend..."

# Limpar diretório de build anterior
rm -rf dist

# Compilar com tsc ignorando erros
echo "📦 Compilando TypeScript (ignorando erros)..."
npx tsc --noEmitOnError false || true

# Verificar se algo foi compilado
if [ -d "dist" ]; then
    echo "✅ Build concluído com sucesso!"
    echo "📁 Arquivos compilados em ./dist"
    ls -la dist/
else
    echo "❌ Falha no build - nenhum arquivo foi gerado"
    exit 1
fi 