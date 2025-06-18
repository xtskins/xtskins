# 🧪 Como Testar o Sistema de Cache das Skins

## 🚀 Configuração para Testes

### **1. Desenvolvimento (`npm run dev`)**
```bash
npm run dev
```

**Características:**
- ✅ **Melhor para testar**: Hot reload, logs em tempo real
- ✅ **Cache TTL reduzido**: 1 minuto (vs 5 minutos em produção)
- ✅ **Logs detalhados**: Todos os logs de cache visíveis no terminal
- ✅ **Revalidação imediata**: Mudanças aparecem rapidamente

### **2. Produção (`npm run build + npm run start`)**
```bash
npm run build
npm run start
```

**Características:**
- ✅ **Comportamento real**: Exatamente como em produção
- ✅ **Cache TTL completo**: 5 minutos
- ✅ **Otimizações ativas**: ISR funcionando completamente
- ❌ **Mais lento para testar**: Sem hot reload

## 🎯 **Recomendação: Use `npm run dev` para testes**

Para testar o cache e revalidações, **sempre use `npm run dev`** porque:
- Cache expira em 1 minuto (mais rápido para testar)
- Logs são mais detalhados
- Mudanças são visíveis imediatamente

## 🧪 Roteiro de Testes

### **Teste 1: Cache Básico do ISR**

1. **Inicie a aplicação:**
   ```bash
   npm run dev
   ```

2. **Primeira requisição:**
   - Acesse `http://localhost:3000`
   - ✅ Deve ver no console: "🚀 Iniciando busca de dados das skins..."
   - ✅ Página carrega (primeira geração)

3. **Requisições subsequentes:**
   - Recarregue a página várias vezes nos próximos 60 segundos
   - ✅ Deve ser instantâneo (servido do cache do Next.js)
   - ✅ **NÃO** deve aparecer logs de busca no console

4. **Após 1 minuto:**
   - Recarregue novamente
   - ✅ Deve ver novamente os logs de cache/busca
   - ✅ Página regenerada em background

### **Teste 2: Revalidação Automática na Edição**

1. **Acesse a página admin de skins** (onde está o AdminSkinCard)

2. **Edite uma skin:**
   - Clique em "Editar" em qualquer skin
   - Altere o preço ou visibilidade
   - Clique em "Salvar"

3. **Verifique os logs no console:**
   ```
   🔄 Skin atualizada, invalidando cache das skins...
   🔄 Invalidando cache e revalidando páginas...
   ✅ Cache das skins invalidado com sucesso após atualização
   ✅ Cache server-side invalidado com sucesso
   ```

4. **Teste a página inicial:**
   - Acesse `http://localhost:3000` em outra aba
   - ✅ Deve ver as alterações imediatamente
   - ✅ Deve gerar nova página (não usar cache antigo)

### **Teste 3: Revalidação Manual**

1. **Via botão admin:**
   - Use o `RefreshCacheButton` no admin
   - ✅ Deve ver toast de sucesso
   - ✅ Deve ver logs de revalidação

2. **Via API:**
   ```bash
   curl -X POST http://localhost:3000/api/cache/skins \
     -H "Content-Type: application/json" \
     -d '{"action": "invalidate"}'
   ```

3. **Via Server Action:**
   - Qualquer componente que use `useSkinsCache`

## 📊 Logs Esperados

### **Cache Hit (usando cache):**
```
🔍 getCachedSkins chamado: { hasCache: true, isExpired: false }
✅ Usando cache existente
```

### **Cache Miss (regenerando):**
```
🔍 getCachedSkins chamado: { hasCache: false, isExpired: true }
🔄 Cache inválido ou refresh forçado, atualizando...
🚀 Iniciando busca de dados das skins...
📦 Dados recebidos: { skinsCount: 150, skinTypesCount: 8 }
✅ Cache atualizado com sucesso
```

### **Revalidação após edição:**
```
🔄 Skin atualizada, invalidando cache das skins...
🔄 Invalidando cache e revalidando páginas...
✅ Página / revalidada
✅ Layout revalidado
✅ Cache das skins invalidado com sucesso após atualização
```

## 🔍 Ferramentas de Debug

### **1. Console do Navegador:**
- Abra DevTools → Console
- Todos os logs de cache aparecem aqui

### **2. Network Tab:**
- Veja as requisições sendo feitas
- Cache hit = 0 requisições extras
- Cache miss = requisições ao banco

### **3. Terminal do servidor:**
- Logs detalhados de todas as operações
- Timestamps de cache
- Erros de revalidação

## 🚨 Problemas Comuns

### **Problema: Cache não está funcionando**
```bash
# Verifique se não tem force-dynamic
grep -r "force-dynamic" app/
# Deve retornar apenas comments ou estar removido
```

### **Problema: Revalidação não funciona**
```bash
# Verifique se as funções estão sendo importadas
grep -r "invalidateSkinsAndRevalidate" .
```

### **Problema: Mudanças não aparecem**
- ✅ Verifique os logs de revalidação
- ✅ Limpe o cache do navegador
- ✅ Teste em aba anônima

## 📈 Métricas de Performance

### **Antes (force-dynamic):**
- **Primeira carga**: ~800ms
- **Recarregamentos**: ~400ms (sempre executa servidor)
- **20 usuários**: 20 execuções do layout

### **Depois (ISR + cache):**
- **Primeira carga**: ~800ms
- **Cache hit**: ~50ms (instantâneo)
- **20 usuários em 5min**: 1 execução do layout

### **Resultado esperado:**
- ✅ **90%+ redução** no tempo de carregamento
- ✅ **95%+ redução** na carga do servidor
- ✅ **Revalidação automática** funcionando 