# Configuração do Google reCAPTCHA v3

## Pré-requisitos

1. Ter uma conta Google
2. Acesso ao [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)

## Configuração no Google reCAPTCHA

1. Acesse o [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Clique em "+" para criar um novo site
3. Preencha as informações:
   - **Label**: Nome do seu projeto (ex: XTSkins)
   - **reCAPTCHA type**: Selecione "reCAPTCHA v3"
   - **Domains**: Adicione seus domínios:
     - `localhost` (para desenvolvimento)
     - Seu domínio de produção (ex: `xtskins.com.br`)
4. Aceite os termos de serviço
5. Clique em "Submit"

## Configuração na Aplicação

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis no seu arquivo `.env.local`:

```bash
# Google reCAPTCHA v3
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=sua_site_key_aqui
RECAPTCHA_SECRET_KEY=sua_secret_key_aqui
```

**Importante**: 
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` é a chave pública (site key)
- `RECAPTCHA_SECRET_KEY` é a chave privada (secret key) - use apenas no backend

### 2. Implementação já Configurada

A implementação do reCAPTCHA v3 já está configurada nos seguintes locais:

#### Frontend:
- ✅ Hook customizado: `hooks/useRecaptcha.ts`
- ✅ Provider: `components/providers/RecaptchaProvider.tsx`
- ✅ Integração no layout: `app/layout.tsx`
- ✅ Integração no contexto de pedidos: `context/OrderContext.tsx`
- ✅ Integração no carrinho: `components/CartButton/index.tsx`

#### Tipos e API:
- ✅ Tipo atualizado: `lib/types/order.ts`
- ✅ API atualizada: `lib/api/orderApi.ts`
- ✅ Hook de pedidos atualizado: `hooks/useOrders.ts`

## Como Funciona

### 1. Criação de Pedidos
- Quando o usuário clica em "Finalizar Pedido", o sistema:
  1. Gera um token reCAPTCHA com a ação `create_order`
  2. Inclui o token na requisição para criar o pedido
  3. O backend verifica o token antes de processar o pedido

### 2. Validação de Cupons
- Quando o usuário aplica um cupom, o sistema:
  1. Gera um token reCAPTCHA com a ação `validate_coupon`
  2. Inclui o token na requisição de validação
  3. O backend verifica o token antes de validar o cupom

## Configuração no Backend

Para completar a implementação, você precisa verificar o token reCAPTCHA no backend:

```typescript
// Exemplo de verificação no backend
async function verifyRecaptcha(token: string, expectedAction: string) {
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      secret: process.env.RECAPTCHA_SECRET_KEY!,
      response: token,
    }),
  })

  const data = await response.json()
  
  if (!data.success) {
    throw new Error('Token reCAPTCHA inválido')
  }

  // Verificar a ação (opcional mas recomendado)
  if (data.action !== expectedAction) {
    throw new Error('Ação reCAPTCHA inválida')
  }

  // Verificar o score (opcional)
  if (data.score < 0.5) {
    throw new Error('Score reCAPTCHA muito baixo')
  }

  return data
}
```

## Testando

1. Inicie o servidor de desenvolvimento
2. Acesse a aplicação
3. Adicione itens ao carrinho
4. Tente finalizar um pedido ou aplicar um cupom
5. Verifique no console do navegador se há erros relacionados ao reCAPTCHA

## Solução de Problemas

### Erro: "reCAPTCHA não está carregado"
- Verifique se a variável `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` está configurada
- Verifique se o domínio está registrado no Google reCAPTCHA

### Erro: "Falha na verificação de segurança"
- Verifique a conexão com internet
- Verifique se o site key está correto
- Verifique se o domínio está autorizado

## Configurações Avançadas

### Personalizar Idioma
O reCAPTCHA está configurado para português brasileiro (`pt-BR`). Para alterar:

```typescript
// Em components/providers/RecaptchaProvider.tsx
<GoogleReCaptchaProvider
  reCaptchaKey={recaptchaSiteKey}
  language="en" // Altere aqui
  // ...
>
```

### Personalizar Ações
Você pode adicionar mais ações específicas para diferentes operações:

```typescript
// Exemplos de ações
await executeRecaptchaAction('login')
await executeRecaptchaAction('register')
await executeRecaptchaAction('payment')
```

## Segurança

- ✅ O token reCAPTCHA é gerado dinamicamente para cada ação
- ✅ Tokens têm validade limitada (geralmente 2 minutos)
- ✅ Cada token é único e não pode ser reutilizado
- ✅ O backend deve sempre verificar os tokens
- ✅ Recomenda-se verificar o score (0.0 a 1.0) no backend 