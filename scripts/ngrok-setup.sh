#!/bin/bash

# Script para configurar ngrok com a aplicação XTSkins
# Uso: ./scripts/ngrok-setup.sh [porta] [subdominio]

PORT=${1:-3000}
SUBDOMAIN=$2

echo "🚀 Configurando ngrok para XTSkins..."
echo "Porta: $PORT"

# Verificar se ngrok está instalado
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok não encontrado. Instale com: npm install -g ngrok"
    exit 1
fi

# Verificar se .env.local existe
if [ ! -f ".env.local" ]; then
    echo "⚠️  Arquivo .env.local não encontrado!"
    echo "Crie o arquivo .env.local com as variáveis necessárias."
    exit 1
fi

echo "✅ Pré-requisitos verificados"

# Iniciar ngrok
if [ -n "$SUBDOMAIN" ]; then
    echo "🌐 Iniciando ngrok com subdomínio: $SUBDOMAIN"
    ngrok http $PORT --subdomain=$SUBDOMAIN
else
    echo "🌐 Iniciando ngrok na porta $PORT"
    ngrok http $PORT
fi 