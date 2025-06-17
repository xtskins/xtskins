# Automação Steam - Sistema de steam_login_secure

Este sistema automatiza a obtenção do `steam_login_secure` para requisições de inventário Steam, utilizando **apenas refresh tokens** - sem armazenar credenciais sensíveis.

## Como funciona

O sistema utiliza a biblioteca `steam-session` para:
1. Trabalhar **apenas com refresh tokens** (sem salvar username/password)
2. Renovar `steam_login_secure` automaticamente
3. Manter sessões válidas por ~200 dias
4. Fallback automático quando tokens expiram

## Configuração Inicial

### 1. Executar a migração do banco

Execute o SQL da migração para criar a tabela:

```sql
-- Execute o conteúdo de database/migrations/create_steam_admin_credentials_table.sql
```

### 2. Obter refresh token (Apenas uma vez)

**Opção A: Via steam-session (recomendado)**

Use a biblioteca `steam-session` localmente para obter o refresh token:

```javascript
import { LoginSession, EAuthTokenPlatformType } from 'steam-session'

const session = new LoginSession(EAuthTokenPlatformType.WebBrowser)

// Fazer login (confirmar 2FA se necessário)
const result = await session.startWithCredentials({
  accountName: 'seu_username',
  password: 'sua_senha'
})

// Aguardar autenticação
session.on('authenticated', () => {
  const refreshToken = session.refreshToken
  console.log('Refresh Token:', refreshToken)
  // Salvar este token via API
})
```

**Opção B: Via interface web (futuro)**

Você pode criar uma interface admin para fazer este processo via web.

### 3. Salvar refresh token via API

**POST** `/api/v1/admin/steam-auth`

```json
{
  "refreshToken": "eyAidHlwIjogIkpXVCIsICJhbGciOiAiRWREU0EiIH0..."
}
```

**Headers:**
```
Authorization: Bearer seu_access_token
```

⚠️ **Importante**: Apenas usuários com role 'admin' podem salvar refresh tokens.

## Uso Automático

### Endpoint de Inventário Atualizado

O endpoint `/api/v1/inventory/fetch-inventory` funciona automaticamente:

**POST** `/api/v1/inventory/fetch-inventory`

```json
{
  "steamId": "76561198000000000",
  "forceRefresh": false  // opcional: forçar renovação
}
```

O campo `steamLoginSecure` é **opcional**! Se não fornecido, será obtido automaticamente.

### Fluxo Automático

1. **Primeira requisição**: Sistema usa refresh token salvo
2. **Gera steam_login_secure**: A partir do refresh token
3. **Requisições seguintes**: Usa o mesmo processo (~200 dias de validade)
4. **Auto-renovação**: Se token expirar, renova automaticamente

### Fallback Inteligente

Se uma requisição falhar com 401/403:
1. Sistema tenta renovar o `steam_login_secure`
2. Refaz a requisição automaticamente
3. Se ainda falhar, retorna erro com detalhes

## Endpoints de Gerenciamento

### Obter steam_login_secure atual
**GET** `/api/v1/admin/steam-auth`

Retorna o `steam_login_secure` válido atual usando o refresh token.

### Remover refresh token (logout)
**DELETE** `/api/v1/admin/steam-auth`

Remove o refresh token do sistema (equivalente a logout).

## Tratamento de Erros

### Códigos de Erro Comuns

- `STEAM_AUTH_ERROR`: Problema na autenticação Steam
- `REFRESH_TOKEN_NOT_CONFIGURED`: Admin não configurou refresh token
- `ACCESS_DENIED`: Usuário não é admin

### Exemplo de Resposta de Erro

```json
{
  "success": false,
  "error": {
    "message": "Refresh token não configurado. Configure primeiro via interface admin.",
    "code": "STEAM_AUTH_ERROR"
  }
}
```

## Segurança

### 🔐 Dados Sensíveis
- **Não armazenamos** username ou password
- **Apenas refresh tokens** são salvos no banco
- Refresh tokens são específicos por usuário (RLS)

### Row Level Security (RLS)
- Cada usuário só acessa seus próprios tokens
- Políticas do Supabase garantem isolamento

### Expiração
- Refresh tokens duram ~200 dias
- Renovação automática quando possível
- Logs de todas as operações

## Troubleshooting

### "Refresh token não configurado"
Solução: 
1. Obtenha um refresh token via `steam-session`
2. Salve usando `POST /api/v1/admin/steam-auth`

### "Falha ao renovar cookies"
Possíveis causas:
- Refresh token expirou (após ~200 dias)
- Muitos logins simultâneos na conta Steam
- Problemas de conectividade com Steam

Solução: Obter novo refresh token

### Token expira rapidamente
- Verifique se não está fazendo login em muitos dispositivos
- Steam pode invalidar tokens se detectar uso suspeito

## Vantagens desta Abordagem

✅ **Seguro**: Não armazena credenciais sensíveis  
✅ **Automático**: Zero intervenção manual após configuração  
✅ **Duradouro**: Refresh tokens duram meses  
✅ **Simples**: Apenas 3 campos no banco (id, user_id, refresh_token)  
✅ **Compatível**: Funciona com todas as contas Steam  
✅ **Auditável**: Logs de todas as operações  

## Estrutura do Banco

```sql
CREATE TABLE steam_admin_credentials (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  refresh_token TEXT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

Simples, seguro e eficiente! 🚀

## Fluxo Recomendado

1. **Setup único**: Obter refresh token via `steam-session` localmente
2. **Salvar**: `POST /api/v1/admin/steam-auth` com o token
3. **Usar**: Endpoints funcionam automaticamente por meses
4. **Renovar**: Apenas quando refresh token expirar (~200 dias)

Nenhuma credencial sensível é armazenada, apenas o refresh token que permite renovar sessões automaticamente! 