#!/bin/bash

# Script para iniciar automaticamente a aplicação e ngrok
# Uso: ./scripts/dev-with-ngrok.sh [subdomain]

SUBDOMAIN=$1
PORT=3000

echo "🚀 Iniciando XTSkins com ngrok..."

# Verificar se ngrok está instalado
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok não encontrado. Instale com: npm install -g ngrok"
    exit 1
fi

# Verificar se porta está disponível
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Porta $PORT já está em uso. Finalizando processos..."
    lsof -ti:$PORT | xargs kill -9
    sleep 2
fi

# Função para cleanup ao sair
cleanup() {
    echo "🧹 Finalizando processos..."
    jobs -p | xargs -r kill
    exit 0
}

trap cleanup SIGINT SIGTERM

# Iniciar aplicação em background
echo "🏗️  Iniciando aplicação Next.js na porta $PORT..."
npm run dev:ngrok &
APP_PID=$!

# Aguardar aplicação iniciar
echo "⏳ Aguardando aplicação inicializar..."
sleep 10

# Verificar se aplicação está rodando
if ! curl -s http://localhost:$PORT >/dev/null; then
    echo "❌ Aplicação não está respondendo na porta $PORT"
    kill $APP_PID 2>/dev/null
    exit 1
fi

echo "✅ Aplicação rodando em http://localhost:$PORT"

# Iniciar ngrok
echo "🌐 Iniciando ngrok..."
if [ -n "$SUBDOMAIN" ]; then
    echo "📡 Usando subdomínio: $SUBDOMAIN"
    ngrok http $PORT --subdomain=$SUBDOMAIN &
else
    ngrok http $PORT &
fi

NGROK_PID=$!

# Aguardar ngrok inicializar
sleep 5

# Obter URL do ngrok
echo "🔍 Obtendo URL do ngrok..."
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$NGROK_URL" ]; then
    echo ""
    echo "🎉 Configuração concluída!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📱 Aplicação local: http://localhost:$PORT"
    echo "🌐 URL pública: $NGROK_URL"
    echo "⚙️  Dashboard ngrok: http://localhost:4040"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📝 PRÓXIMOS PASSOS:"
    echo "1. Atualize NEXT_PUBLIC_APP_URL no .env.local:"
    echo "   NEXT_PUBLIC_APP_URL=$NGROK_URL"
    echo ""
    echo "2. Configure no Supabase:"
    echo "   - Site URL: $NGROK_URL"
    echo "   - Redirect URL: $NGROK_URL/auth/callback"
    echo ""
    echo "3. Reinicie a aplicação para aplicar as mudanças"
    echo ""
    echo "⌨️  Pressione Ctrl+C para finalizar ambos os processos"
else
    echo "❌ Não foi possível obter a URL do ngrok"
    echo "🔍 Verifique o dashboard em: http://localhost:4040"
fi

# Manter script rodando
wait 