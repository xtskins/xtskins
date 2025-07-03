# 🌐 Configuração do ngrok para XTSkins

Este guia explica como configurar e usar o ngrok para expor sua aplicação XTSkins localmente para a internet.

## 📋 Pré-requisitos

1. **Node.js** instalado
2. **ngrok** instalado globalmente
3. Conta no **ngrok** (para subdomínios personalizados)

## 🚀 Instalação

### 1. Instalar ngrok

```bash
# Via npm (recomendado)
npm install -g ngrok

# Ou baixar direto do site oficial
# https://ngrok.com/download
```

### 2. Autenticar ngrok (opcional)

Para usar subdomínios personalizados:

```bash
ngrok authtoken SEU_TOKEN_AQUI
```

## ⚙️ Configuração

### 1. Variáveis de ambiente

Crie/edite o arquivo `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# URL da aplicação (atualize com a URL do ngrok)
NEXT_PUBLIC_APP_URL=https://sua-url-ngrok.ngrok.io

# Resend (email)
RESEND_API_KEY=your_resend_api_key

# reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key

# Steam (opcional)
STEAM_API_KEY=your_steam_api_key
```

### 2. Configurar callback URLs no Supabase

Após obter a URL do ngrok, configure no Supabase:

1. Acesse o **dashboard do Supabase**
2. Vá em **Authentication > URL Configuration**
3. Adicione sua URL ngrok nos **Site URLs**:
   ```
   https://sua-url-ngrok.ngrok.io
   ```
4. Adicione no **Redirect URLs**:
   ```
   https://sua-url-ngrok.ngrok.io/auth/callback
   ```

## 🏃‍♂️ Como usar

### Método 1: Scripts npm (recomendado)

```bash
# Terminal 1 - Iniciar aplicação
npm run dev:ngrok

# Terminal 2 - Iniciar ngrok
npm run ngrok

# Ou com subdomínio personalizado
npm run ngrok:subdomain
```

### Método 2: Script helper

```bash
# Uso básico
./scripts/ngrok-setup.sh

# Com porta personalizada
./scripts/ngrok-setup.sh 3001

# Com subdomínio personalizado
./scripts/ngrok-setup.sh 3000 xtskins-dev
```

### Método 3: Manual

```bash
# Terminal 1 - Iniciar aplicação
npm run dev

# Terminal 2 - Iniciar ngrok
ngrok http 3000
```

## 📝 Fluxo de trabalho completo

1. **Iniciar aplicação**:
   ```bash
   npm run dev:ngrok
   ```

2. **Iniciar ngrok** (novo terminal):
   ```bash
   npm run ngrok
   ```

3. **Copiar URL do ngrok**:
   ```
   Forwarding    https://abc123.ngrok.io -> http://localhost:3000
   ```

4. **Atualizar .env.local**:
   ```bash
   NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
   ```

5. **Reiniciar aplicação** para aplicar a nova URL:
   ```bash
   # Ctrl+C no terminal da aplicação e depois:
   npm run dev:ngrok
   ```

6. **Configurar no Supabase** (conforme seção acima)

## 🔧 Configurações avançadas

### Subdomínio fixo

Para manter a mesma URL entre sessões:

```bash
ngrok http 3000 --subdomain=xtskins-dev
```

**Nota**: Requer conta paga do ngrok.

### Arquivo de configuração do ngrok

Crie `~/.ngrok2/ngrok.yml`:

```yaml
version: "2"
authtoken: SEU_TOKEN_AQUI
tunnels:
  xtskins:
    proto: http
    addr: 3000
    subdomain: xtskins-dev
```

Uso:
```bash
ngrok start xtskins
```

### HTTPS local (alternativa)

Para desenvolvimento sem ngrok:

```bash
# Instalar mkcert
brew install mkcert

# Configurar certificados
mkcert -install
mkcert localhost

# Usar HTTPS local
npm run dev -- --experimental-https
```

## 🚨 Considerações importantes

### 1. URLs de callback
- Sempre atualize as URLs no Supabase
- URLs do Steam Auth também precisam ser atualizadas
- Email templates usam `NEXT_PUBLIC_APP_URL`

### 2. Cache e cookies
- Limpe o cache do browser ao trocar URLs
- Cookies podem não funcionar entre domínios diferentes

### 3. CORS
- ngrok pode ter problemas de CORS
- Configure adequadamente no Next.js se necessário

### 4. Segurança
- **NUNCA** use ngrok em produção
- Apenas para desenvolvimento e testes
- URLs do ngrok são públicas

## 🛠 Troubleshooting

### Problema: "URL inválida" no Supabase
**Solução**: Verificar se adicionou a URL do ngrok no dashboard do Supabase.

### Problema: Cookies não funcionam
**Solução**: Verificar se `NEXT_PUBLIC_APP_URL` está correto no `.env.local`.

### Problema: Email templates com URL errada
**Solução**: Reiniciar a aplicação após atualizar `NEXT_PUBLIC_APP_URL`.

### Problema: Steam Auth não funciona
**Solução**: Verificar se as URLs de callback estão corretas.

### Problema: ngrok expira rapidamente
**Solução**: 
- Usar conta autenticada do ngrok
- Considerar plano pago para URLs fixas

## 📚 Links úteis

- [Documentação oficial do ngrok](https://ngrok.com/docs)
- [Supabase URL Configuration](https://supabase.com/docs/guides/auth)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

## 🎯 Casos de uso

### Teste de webhooks
```bash
# Expor endpoint para webhooks externos
ngrok http 3000
# URL: https://abc123.ngrok.io/api/webhook
```

### Demonstração para cliente
```bash
# Usar subdomínio profissional
ngrok http 3000 --subdomain=xtskins-demo
```

### Teste em dispositivos móveis
```bash
# Acessar pelo celular usando a URL do ngrok
ngrok http 3000
```

### Desenvolvimento colaborativo
```bash
# Compartilhar ambiente local com equipe
ngrok http 3000 --subdomain=xtskins-team
```

---

**Dica**: Mantenha sempre o ngrok rodando em um terminal separado e a aplicação em outro para facilitar o desenvolvimento! 🚀 