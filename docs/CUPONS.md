# Sistema de Cupons - XTSkins

## Visão Geral

O sistema de cupons do XTSkins permite que os usuários apliquem códigos promocionais para obter descontos em suas compras. O sistema suporta cupons de desconto percentual e valor fixo, com validações robustas e controle de uso.

## Estrutura do Banco de Dados

### Tabela `coupons`

A tabela principal que armazena informações dos cupons:

```sql
CREATE TABLE public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type coupon_type NOT NULL DEFAULT 'percentage',
    value DECIMAL(10,2) NOT NULL CHECK (value > 0),
    max_discount_amount DECIMAL(10,2),
    min_order_amount DECIMAL(10,2) DEFAULT 0,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    usage_limit_per_user INTEGER DEFAULT 1,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    status coupon_status DEFAULT 'active',
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabela `coupon_usage`

Rastreia o uso de cupons pelos usuários:

```sql
CREATE TABLE public.coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    order_id UUID NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(coupon_id, user_id, order_id)
);
```

## Tipos de Cupom

### 1. Cupom Percentual (`percentage`)
- Aplica desconto em porcentagem sobre o valor total
- Pode ter um valor máximo de desconto (`max_discount_amount`)
- Exemplo: 20% de desconto limitado a R$ 100

### 2. Cupom de Valor Fixo (`fixed_amount`)
- Aplica desconto de valor fixo em reais
- O desconto não pode exceder o valor total do pedido
- Exemplo: R$ 50 de desconto

## Validações Implementadas

### 1. Validação de Existência
- Cupom deve existir e estar ativo
- Código é case-insensitive

### 2. Validação de Período
- Cupom deve estar dentro do período de validade
- Verifica `start_date` e `end_date`

### 3. Validação de Limite de Uso
- Verifica se o cupom não excedeu o limite total de usos
- Verifica se o usuário não excedeu o limite individual

### 4. Validação de Valor Mínimo
- Verifica se o valor do pedido atende ao mínimo exigido

## APIs Implementadas

### Validar Cupom
```
POST /api/v1/orders/validate-coupon
```

**Parâmetros:**
```json
{
  "couponCode": "DESCONTO10",
  "orderAmount": 150.00
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "data": {
    "coupon_id": "uuid",
    "discount_type": "percentage",
    "discount_value": 10,
    "discount_amount": 15.00,
    "max_discount": null
  }
}
```

**Resposta de Erro:**
```json
{
  "success": false,
  "error": {
    "message": "Cupom inválido ou expirado",
    "code": "INVALID_COUPON"
  }
}
```

### Criar Pedido com Cupom
```
POST /api/v1/orders
```

O cupom é validado automaticamente durante a criação do pedido e o desconto é aplicado ao valor final.

## Funcionalidades do Frontend

### Hook `useOrderActions`
```typescript
const { validateCoupon } = useOrderActions()

// Validar cupom com valor do pedido
const result = await validateCoupon({
  couponCode: 'DESCONTO10',
  orderAmount: 150.00
})
```

### Componente CartButton
- Interface para inserir e validar cupons
- Mostra desconto aplicado em tempo real
- Diferencia entre cupons percentuais e de valor fixo

## Cupons de Exemplo

O sistema vem com alguns cupons pré-cadastrados:

- **DESCONTO10**: 10% de desconto sem limite
- **DESCONTO20**: 20% de desconto limitado a R$ 100, pedido mínimo de R$ 50
- **PRIMEIRACOMPRA**: 15% de desconto para primeira compra, limitado a R$ 50
- **SKIN50**: R$ 50 de desconto fixo, pedido mínimo de R$ 200
- **BLACKFRIDAY**: 30% de desconto para Black Friday, limitado a R$ 150
- **NATAL2024**: 25% de desconto para Natal, limitado a R$ 100
- **WELCOME**: 15% de desconto de boas-vindas, limitado a R$ 75

## Funções do Banco de Dados

### `validate_coupon()`
Função principal que valida se um cupom pode ser usado:

```sql
SELECT * FROM validate_coupon('DESCONTO10', 'user_uuid', 150.00);
```

### `increment_coupon_usage()`
Incrementa o contador de uso do cupom:

```sql
SELECT increment_coupon_usage('coupon_uuid');
```

## Fluxo de Uso

1. **Usuário insere cupom**: No carrinho, o usuário digita um código
2. **Validação**: O sistema valida o cupom considerando todas as regras
3. **Aplicação**: Se válido, o desconto é aplicado visualmente
4. **Criação do pedido**: Durante a criação, o cupom é validado novamente
5. **Registro de uso**: O uso é registrado na tabela `coupon_usage`
6. **Incremento de contador**: O contador `used_count` é incrementado

## Segurança

- Todas as validações são feitas no servidor
- Uso de RLS (Row Level Security) para controle de acesso
- Validação dupla: no frontend e no backend
- Prevenção contra uso duplicado com constraints únicos

## Próximos Passos

- Interface de administração para gerenciar cupons
- Relatórios de uso de cupons
- Cupons com restrições por categoria de produto
- Sistema de cupons automáticos (aniversário, primeira compra, etc.) 