# Detalhamento de Fases de Desenvolvimento — Plataforma de Pizzaria Full-Stack

Construção estritamente incremental. Nenhuma fase é iniciada sem a aprovação formal do Quality Gate da fase anterior.

---

## FASE 0 — INSPEÇÃO, DOCUMENTAÇÃO VIVA E ARQUITETURA BASELINE
- **Status**: CONCLUÍDA E APROVADA (Gate F0: PASS)
- **Commit**: `2d324ad`

---

## FASE 1 — FOUNDATION & DESIGN SYSTEM GASTRONÔMICO
- **Status**: CONCLUÍDA E APROVADA (Gate F1: PASS)
- **Commit**: `6dae654`

---

## FASE 2 — CARDÁPIO, CONSTRUTOR DE PIZZA & CARRINHO INTELIGENTE
- **Status**: CONCLUÍDA E APROVADA (Gate F2: PASS)
- **Entregáveis Concluídos**:
  - Motor de cálculo de preços de domínio em centavos inteiros (`calculateItemPrice` em `src/domain/pricing.ts`).
  - Suporte completo a Sabor Único, Meio a Meio por `maior_valor` e `media_ponderada`, Bordas e Extras.
  - Catálogo de produtos com abas de categorias, contagem, busca instantânea e filtros rápidos.
  - Modal Construtor de Pizza (`PizzaBuilderModal`) com visualização de fatias, seleção de 2º sabor, bordas, adicionais e remoção de ingredientes.
  - Carrinho de compras gerenciado por Zustand (`cartStore.ts`) com persistência em `localStorage` e reidratação segura.
  - Drawer do Carrinho com detalhamento completo da itemização e alteração de quantidade.
  - 57 testes automatizados passando (unitários de precificação, carrinho, componentes e integração).
  - Testes em navegador desktop e mobile concluídos com 0 erros.
- **Quality Gate F2**: PASS (Build OK, Types OK, Lint OK, Testes OK, UX/Mobile OK).

---

## FASE 3 — CHECKOUT, ANTI-TAMPERING & INTEGRAÇÃO WHATSAPP
- **Status**: PRONTO PARA INICIAR (Aguardando autorização)
- **Objetivo**: Implementar fluxo de checkout (Delivery vs Retirada), consulta de CEP com ViaCEP e fallback manual resiliente, cálculo de taxa de entrega, opções de pagamento (Pix, Cartão, Dinheiro com troco) e proteção rígida contra adulteração de preços na API `/api/orders`.

---

## FASE 4 — BACKEND SUPABASE, RLS, STORAGE & UPLOAD WEBP
- **Status**: PENDENTE (Bloqueado por Gate F3)
- **Objetivo**: Configurar infraestrutura oficial do Supabase/PostgreSQL com migrações SQL, tabelas completas, triggers, políticas de RLS granulares com RBAC (`user_roles`) e pipeline de upload com conversão WebP via Canvas API.

---

## FASE 5 — PAINEL ADMINISTRATIVO & KANBAN EM TEMPO REAL
- **Status**: PENDENTE (Bloqueado por Gate F4)
- **Objetivo**: Criar o painel administrativo protegido, dashboard operacional com métricas, quadro Kanban com transição de status em tempo real (Supabase Realtime), alerta sonoro via Web Audio API, gerenciamento de produtos/categorias e controle de horários da loja.

---

## FASE 6 — POLIMENTO, ACESSIBILIDADE, PERFORMANCE & AUDITORIA FINAL
- **Status**: PENDENTE (Bloqueado por Gate F5)
- **Objetivo**: Refinar toda a experiência de usuário com skeletons, empty states, error boundaries, auditoria WCAG 2.1 AA de acessibilidade, otimização de SEO com Schema.org (`Restaurant`, `Menu`), auditoria global de regressão e certificação de prontidão para produção.
