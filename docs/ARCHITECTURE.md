# Arquitetura do Sistema — Plataforma de Pizzaria Full-Stack

## 1. Visão Geral e Princípios Arquiteturais

A plataforma é projetada sob os princípios de alta coesão, baixo acoplamento, manutenibilidade e segurança por padrão.

### Princípios Inegociáveis:
1. **O Backend é a Única Fonte da Verdade**:
   - Supabase/PostgreSQL é a fonte autoritativa de dados e estado.
   - O cliente web apenas manifesta intenções (seleção de produtos, endereço, canal de pagamento).
   - Preços, disponibilidades, regras de negócio e taxas são recalculados e validados integralmente no servidor.
2. **Separação Rígida em Camadas**:
   - **UI / Presentation**: Componentes React no Next.js App Router (`/app`, `/components`).
   - **State Management**: Zustand para carrinho de compras e sincronização reativa de interface.
   - **Application Services / API**: Route Handlers (`/api/*`) e Server Actions para orquestração, validação de requisições e mutações seguras.
   - **Domain / Business Rules**: Funções puras em TypeScript (`/domain/*`) contendo regras de precificação, cálculo meio a meio, regras de horário e validações estritas de negócio.
   - **Repositories / Data Access**: Interfaces de contrato (`/repositories/interfaces.ts`) implementadas oficialmente via Supabase (`SupabaseProductRepository`, `SupabaseOrderRepository`, etc.).
   - **Mock Repositories**: Utilizados **estritamente para a suíte de testes automatizados (Vitest)**, emulando fielmente o comportamento das tabelas e RLS do PostgreSQL sem criar um modo offline concorrente na aplicação de produção.
3. **Valores Monetários em Centavos Inteiros**:
   - Todos os valores de moeda são armazenados como inteiros (`cents`), eliminando erros de arredondamento inerentes a IEEE 754 float.
   - Apenas na camada de UI os centavos são convertidos em string formatada em pt-BR (`R$ 00,00`).

---

## 2. Diagrama de Fluxo em Camadas

```text
+-------------------------------------------------------------+
|                     INTERFACE DO USUÁRIO                    |
|             (Next.js App Router + Tailwind CSS)             |
|   Área Pública (/cardapio, /carrinho, /checkout, /pedido)   |
|   Painel Admin (/admin/dashboard, /admin/pedidos [Kanban])  |
+-------------------------------------------------------------+
                              │
                              ▼
+-------------------------------------------------------------+
|                   GERENCIAMENTO DE ESTADO                   |
|      (Zustand: useCartStore com persistência controlada)    |
+-------------------------------------------------------------+
                              │
                              ▼
+-------------------------------------------------------------+
|               SERVIÇOS DE APLICAÇÃO & ROTAS                 |
|             (Next.js Route Handlers: /api/orders)           |
|      - Validação de Payload com Zod                         |
|      - Sanitização contra abuso                             |
|      - Verificação de Autenticação / RBAC                   |
+-------------------------------------------------------------+
                              │
                              ▼
+-------------------------------------------------------------+
|                     REGRAS DE DOMÍNIO                       |
|         (Módulos Puros: /domain/pricing, /domain/hours)     |
|      - Recálculo forçado de Preços, Meio a Meio e Extras    |
|      - Avaliação de Horário de Operação da Loja             |
+-------------------------------------------------------------+
                              │
                              ▼
+-------------------------------------------------------------+
|               CONTRATOS DE REPOSITÓRIO (DAO)                |
|              (/repositories/interfaces.ts)                  |
|          IProductRepository | IOrderRepository              |
+-------------------------------------------------------------+
                 │                                │
                 ▼ (Produção)                     ▼ (Testes Automatizados)
+---------------------------------+  +---------------------------------+
|   Supabase Repositories         |  |   Mock In-Memory Repositories   |
|   (@supabase/supabase-js, RLS)  |  |   (Vitest Unit & Integration)   |
+---------------------------------+  +---------------------------------+
                 │
                 ▼
+-------------------------------------------------------------+
|                 SUPABASE / POSTGRESQL                       |
|   - Tabelas, Índices e Triggers                             |
|   - Row Level Security (RLS) com RBAC Granular              |
|   - Supabase Realtime (INSERT + UPDATE)                     |
|   - Supabase Storage (Imagens WebP processadas)             |
+-------------------------------------------------------------+
```

---

## 3. Estratégia de Realtime, Polling e Reconciliação Determinística

A sincronização de estado em tempo real opera sob uma estratégia híbrida robusta e determinística:

1. **Supabase Realtime como Mecanismo Principal de Baixa Latência**:
   - Canal `admin-orders-realtime` escutando eventos de `postgres_changes` na tabela `orders`.
   - **INSERT**: Insere imediatamente o novo pedido no topo da coluna `Novo` do Kanban e dispara o sintetizador sonoro (Web Audio API).
   - **UPDATE**: Atualiza a coluna de status do pedido de forma reativa e instantânea.
2. **Polling de 10 Segundos como Fallback / Resync**:
   - Atua estritamente como rede de segurança para ambientes com oscilação de WebSocket ou pacotes perdidos.
   - Consulta periódica a `/api/orders` garantindo convergência de estado mesmo sob instabilidades de rede móvel na cozinha.
3. **Reconciliação e Deduplicação Determinística (`orderReconciliation.ts`)**:
   - **Chave de Unicidade**: Todo pedido é indexado unicamente pelo seu `id` (UUID).
   - **Resolução de Conflitos por Timestamp**: Cada atualização compara `incoming.updated_at >= existing.updated_at`. Se um evento Realtime mais novo já tiver sido processado, qualquer resposta atrasada do polling é sumariamente DESCARTADA, eliminando reversões de status ou race conditions.
   - **Idempotência**: O processamento repetido do mesmo evento Realtime ou resposta de polling produz exatamente o mesmo estado final estável, sem duplicação de pedidos no Kanban.

---

## 4. Pipeline de Mídia e Imagens

- **Entrada**: Upload por botão, Drag & Drop ou Clipboard Paste (`Ctrl+V` / `Cmd+V`).
- **Processamento Client-Side**:
  - Validação de formato (PNG, JPEG, WebP).
  - Redimensionamento proporcional via `Canvas API` limitando a largura máxima em `1200px`.
  - Conversão para `image/webp` com qualidade `0.82`.
- **Upload e Persistência**:
  - Envio autenticado para o Supabase Storage bucket `products`.
  - Persistência da URL canônica no campo `images` (JSONB) do produto.
  - Limpeza de referências de Blob URLs em memória para prevenção de leaks.
