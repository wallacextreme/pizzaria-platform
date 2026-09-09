# Detalhamento de Fases de Desenvolvimento — Plataforma de Pizzaria Full-Stack

Construção estritamente incremental. Nenhuma fase é iniciada sem a aprovação formal do Quality Gate da fase anterior.

---

## FASE 0 — INSPEÇÃO, DOCUMENTAÇÃO VIVA E ARQUITETURA BASELINE
- **Status**: CONCLUÍDA E APROVADA (Gate F0: PASS)
- **Commit**: `2d324ad`

---

## FASE 1 — FOUNDATION & DESIGN SYSTEM GASTRONÔMICO
- **Status**: CONCLUÍDA E APROVADA (Gate F1: PASS)
- **Entregáveis Concluídos**:
  - Design tokens em Tailwind e CSS Variables (Terracotta, Manjericão, Forno/Queijo, Carvão).
  - Componentes base acessíveis (Button, Badge com pulso, Input com erro, Card, Tabs, Dialog, Drawer, Skeleton, Toast).
  - Header responsivo, Banner promocional e indicador de loja aberta/fechada em tempo real com modal de horários.
  - Barra de navegação inferior mobile (`BottomNav`).
  - Suíte de testes: 28 testes passando (domínio de horários, moeda e componentes UI).
  - Testes de responsividade em navegador cobrindo de 360px a 1440px+.
- **Quality Gate F1**: PASS (Build OK, Types OK, Lint OK, Testes OK, Responsividade OK).

---

## FASE 2 — CARDÁPIO, CONSTRUTOR DE PIZZA & CARRINHO INTELIGENTE
- **Status**: PRONTO PARA INICIAR (Aguardando autorização)
- **Objetivo**: Implementar navegação de produtos por categoria, pesquisa instantânea, modal de montagem de pizza (meio a meio, tamanhos, bordas, extras, remoção de ingredientes) e carrinho persistente com Zustand.
- **Entregáveis**:
  - Catálogo de produtos com filtros e pesquisa.
  - Modal Construtor de Pizza com preview de preço em tempo real.
  - Motor de domínio de cálculo de preço (`maior_valor` vs `media_ponderada`).
  - Carrinho com persistência em `localStorage` e reidratação segura.
- **Quality Gate F2**:
  - Testes unitários para todas as combinações de precificação e meio a meio.
  - Testes do Zustand store.
  - Build e tipos 100% OK. Checkpoint Git.

---

## FASE 3 — CHECKOUT, ANTI-TAMPERING & INTEGRAÇÃO WHATSAPP
- **Status**: PENDENTE (Bloqueado por Gate F2)
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
