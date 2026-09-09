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
- **Commit**: `2b1f752`

---

## FASE 3 — CHECKOUT, ANTI-TAMPERING & INTEGRAÇÃO WHATSAPP
- **Status**: CONCLUÍDA E APROVADA (Gate F3: PASS)
- **Entregáveis Concluídos**:
  - Modal de Checkout (`CheckoutModal`) com alternância Delivery/Retirada e seleção de pagamento (Pix, Cartão, Dinheiro).
  - Consulta automática de CEP com auto-fill e fallback manual transparente (`viacep.ts`).
  - Motor de validação estrita e recálculo total no servidor contra manipulação de preços (`orderValidator.ts`).
  - Endpoint `/api/orders` (POST para criação segura de pedidos e GET para consulta por ID/display_id).
  - Formatador e gerador de URL do WhatsApp (`whatsapp.ts`).
  - Página de rastreamento e confirmação de pedido (`/pedido/[id]`).
  - 69 testes automatizados passando (incluindo testes de segurança anti-tampering).
- **Quality Gate F3**: PASS (Build OK, Types OK, Lint OK, Testes OK, UX/Mobile OK).

---

## FASE 4 — BACKEND SUPABASE, RLS, STORAGE & UPLOAD WEBP
- **Status**: CONCLUÍDA E APROVADA (Gate F4: PASS)
- **Entregáveis Concluídos**:
  - Migração de esquema físico PostgreSQL com chaves, checks e triggers (`001_initial_schema.sql`).
  - Migração de RLS estrito com funções de segurança RBAC `is_admin` e `is_staff_or_admin` via `SECURITY DEFINER` (`002_rls_policies.sql`).
  - Migração de dados semente (categorias, zonas de entrega e configurações da loja) (`003_seed_data.sql`).
  - Migração e políticas de Storage para o bucket `products` com leitura pública e escrita restrita (`004_storage_setup.sql`).
  - Clientes Supabase estruturados para Browser (`client.ts`), Servidor SSR (`server.ts`) e Admin Service Role (`admin.ts`).
  - Pipeline de processamento de imagens no cliente via Canvas API (`imageProcessor.ts`): conversão para WebP (0.82), redimensionamento proporcional a 1200px, remoção de EXIF.
  - Componente de upload acessível (`ImageUpload.tsx`) com suporte a Drag and Drop, seleção e Ctrl+V.
  - Endpoint de upload seguro com inspeção profunda de Magic Bytes RIFF/WEBP e fallback offline para testes (`/api/upload/route.ts`).
  - Implementações concretas de repositórios Supabase (`SupabaseCategoryRepository`, `SupabaseProductRepository`, `SupabaseDeliveryZoneRepository`, `SupabaseOrderRepository`, `SupabaseStoreSettingsRepository`, `SupabaseUserRoleRepository`).
  - 92 testes automatizados passando (13 suítes completas no Vitest).
- **Quality Gate F4**: PASS (Build OK, Types OK, Lint OK, Testes OK, Pipeline WebP OK, RLS OK).


---

## FASE 5 — PAINEL ADMINISTRATIVO & KANBAN EM TEMPO REAL
- **Status**: PENDENTE (Bloqueado por Gate F4)
- **Objetivo**: Criar o painel administrativo protegido, dashboard operacional com métricas, quadro Kanban com transição de status em tempo real (Supabase Realtime), alerta sonoro via Web Audio API, gerenciamento de produtos/categorias e controle de horários da loja.

---

## FASE 6 — POLIMENTO, ACESSIBILIDADE, PERFORMANCE & AUDITORIA FINAL
- **Status**: PENDENTE (Bloqueado por Gate F5)
- **Objetivo**: Refinar toda a experiência de usuário com skeletons, empty states, error boundaries, auditoria WCAG 2.1 AA de acessibilidade, otimização de SEO com Schema.org (`Restaurant`, `Menu`), auditoria global de regressão e certificação de prontidão para produção.
