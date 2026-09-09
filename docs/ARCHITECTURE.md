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

## 3. Estratégia de Realtime e Sincronização

A sincronização de estado em tempo real opera em três canais principais:

1. **Canal `orders-channel`**:
   - **INSERT**: Dispara novo pedido para o Painel Administrativo. Ativa o sintetizador sonoro (Web Audio API) e insere o card na coluna `Novo` do Kanban.
   - **UPDATE**: Atualiza a coluna de status no Kanban e sincroniza a tela do cliente (`/pedido/[id]`) sem necessidade de recarregar a página.
2. **Canal `products-channel`**:
   - **UPDATE**: Dispara atualização de disponibilidade quando um item for pausado ou esgotado pelo admin, atualizando a visualização do cardápio para os clientes instantaneamente.
3. **Canal `store-settings-channel`**:
   - **UPDATE**: Notifica alterações no status operacional (abertura/fechamento manual da loja) instantaneamente no header e banner dos clientes conectados.

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
