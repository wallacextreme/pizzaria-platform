# Status do Projeto — Plataforma de Pizzaria Full-Stack

**Última Atualização**: 2026-09-09
**Fase Atual**: FASE 2 — CATÁLOGO, CONSTRUTOR DE PIZZA & CARRINHO INTELIGENTE
**Status Geral**: FASE 2 CONCLUÍDA E APROVADA (Gate F2: PASS)

---

## 1. Visão Geral das Fases

| Fase | Título | Status | Gate de Qualidade |
| :--- | :--- | :--- | :--- |
| **Fase 0** | Inspeção + Arquitetura + Baseline | **CONCLUÍDA** | **PASS** |
| **Fase 1** | Foundation + Design System Gastronômico | **CONCLUÍDA** | **PASS** |
| **Fase 2** | Cardápio + Construtor de Pizza + Carrinho | **CONCLUÍDA** | **PASS** |
| **Fase 3** | Checkout + Anti-Tampering + WhatsApp | **PRONTO PARA INICIAR** | Pendente autorização |
| **Fase 4** | Backend Supabase + RLS + Storage WebP | PENDENTE | Bloqueado por Gate F3 |
| **Fase 5** | Admin + Kanban Realtime + Alerta Sonoro | PENDENTE | Bloqueado por Gate F4 |
| **Fase 6** | Polimento + Acessibilidade + Auditoria 10/10 | PENDENTE | Bloqueado por Gate F5 |

---

## 2. Checklist do Gate F2 (Critérios de Aceite Validados)

- [x] Motor de Domínio de Preços (`src/domain/pricing.ts`):
  - Função pura `calculateItemPrice` com 100% de integridade matemática em centavos inteiros (`cents`).
  - Suporte a Sabor Único, Meio a Meio por `maior_valor`, Meio a Meio por `media_ponderada`, Bordas Recheadas e Extras Adicionais.
  - Validações estritas de domínio (proibição de 2 sabores em tamanhos de 1 sabor, quantidades inválidas, etc.).
- [x] Catálogo de Produtos Interativo (`src/components/catalog/`):
  - Navegação fluida por abas de categorias com contadores de itens.
  - Busca instantânea textual por nome e ingredientes com botão de limpeza rápida.
  - Filtro para Mais Pedidas / Destaques da Cozinha.
  - Cards acessíveis com formatação de preço em centavos (`formatCentsToBRL`).
  - Estado vazio com orientação clara ao usuário quando a busca não retorna resultados.
- [x] Construtor de Pizza Completo (`src/components/builder/PizzaBuilderModal.tsx`):
  - Seleção intuitiva de Tamanho (Brotinho, Média, Grande, Família) com indicação de fatias.
  - Toggle dinâmico para 1 Sabor ou Meio a Meio (bloqueado em Brotinho por regra de negócio).
  - Seleção do 2º sabor entre todas as pizzas ativas com prevenção de duplicação.
  - Seleção de Borda Recheada (Catupiry, Cheddar, Vulcão, etc.).
  - Seleção de Adicionais Extras (Bacon crocante, Queijo duplo, etc.).
  - Remoção de Ingredientes personalizada (ex: Sem cebola, Sem manjericão).
  - Campo de observações para a cozinha.
  - Cálculo de preço em tempo real e atualização transparente do rodapé.
- [x] Carrinho Persistente Inteligente com Zustand (`src/store/cartStore.ts` & `src/components/cart/CartDrawer.tsx`):
  - Persistência em `localStorage` e prevenção absoluta contra hydration mismatch no Next.js.
  - Agrupamento inteligente de itens com personalizações idênticas (soma de quantidades).
  - Preservação da configuração completa de cada pizza (sabores, borda, extras, removidos, notas).
  - Drawer responsivo com controles de quantidade (`-`, `+`, lixeira), subtotal e botão de checkout.
- [x] Suíte de Testes Automatizados: 57/57 testes passando (Vitest + Testing Library).
- [x] TypeScript estrito validado sem erros (`tsc --noEmit`).
- [x] ESLint executado sem erros ou warnings (`next lint`).
- [x] Compilação de produção validada com sucesso (`next build`).
- [x] Teste em Navegador Real (desktop 1280px e mobile 390px) com evidências capturadas em walkthrough.md.
- [x] Checkpoint Git registrado para Fase 2.
