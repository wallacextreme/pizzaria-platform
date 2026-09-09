# Detalhamento de Fases de Desenvolvimento — Plataforma de Pizzaria Full-Stack

Construção estritamente incremental. Nenhuma fase é iniciada sem a aprovação formal do Quality Gate da fase anterior.

---

## FASE 0 — INSPEÇÃO, DOCUMENTAÇÃO VIVA E ARQUITETURA BASELINE
- **Objetivo**: Inspecionar ambiente, consolidar documentos vivos em `docs/`, definir tipagem e contratos fundamentais, configurar Vitest e garantir compilação inicial limpa.
- **Entregáveis**:
  - Diretório do projeto e inicialização Git.
  - Documentação viva (`docs/*.md`).
  - Setup do projeto Next.js + TypeScript strict + Tailwind + Vitest.
  - Tipos centrais do domínio e interfaces de Repositório (`/types`, `/repositories`).
  - Teste smoke executado.
- **Quality Gate F0**:
  - Build sem erros.
  - TypeScript sem erros (`tsc --noEmit`).
  - Vitest executado com 100% de aprovação.
  - Nenhuma regra/tela de fases posteriores antecipada.
  - Checkpoint Git registrado.

---

## FASE 1 — FOUNDATION & DESIGN SYSTEM GASTRONÔMICO
- **Objetivo**: Estabelecer a identidade visual artesanal/gastronômica, tokens de design, layout público responsivo, componentes base e barra de status operacional.
- **Entregáveis**:
  - Design tokens em Tailwind e CSS Variables (Terracotta, Manjericão, Forno/Queijo, Carvão).
  - Componentes base acessíveis (Button, Input, Badge, Dialog/Modal, Drawer/Sheet, Tabs).
  - Header responsivo, Banner promocional e indicador de loja aberta/fechada em tempo real.
- **Quality Gate F1**:
  - Responsividade validada (360px a 1440px+).
  - Acessibilidade básica e contraste auditados.
  - Build e testes 100% OK. Checkpoint Git.

---

## FASE 2 — CARDÁPIO, CONSTRUTOR DE PIZZA & CARRINHO INTELIGENTE
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
- **Objetivo**: Implementar fluxo de checkout (Delivery vs Retirada), consulta de CEP com ViaCEP e fallback manual resiliente, cálculo de taxa de entrega, opções de pagamento (Pix, Cartão, Dinheiro com troco) e proteção rígida contra adulteração de preços na API `/api/orders`.
- **Entregáveis**:
  - Formulário de checkout e integração ViaCEP.
  - Integração de taxa de entrega com `delivery_zones`.
  - Endpoint `/api/orders` com validação Zod e recálculo total de preços no servidor.
  - Formatador de pedido para WhatsApp com URL encoding seguro.
  - Tela de confirmação e acompanhamento do pedido (`/pedido/[id]`).
- **Quality Gate F3**:
  - Testes de segurança simulando adulteração de preço (rejeição/recálculo forçado).
  - Testes de validação de troco e CEP.
  - Build e tipos 100% OK. Checkpoint Git.

---

## FASE 4 — BACKEND SUPABASE, RLS, STORAGE & UPLOAD WEBP
- **Objetivo**: Configurar infraestrutura oficial do Supabase/PostgreSQL com migrações SQL, tabelas completas, triggers, políticas de RLS granulares com RBAC (`user_roles`) e pipeline de upload com conversão WebP via Canvas API.
- **Entregáveis**:
  - Migrações SQL em `supabase/migrations/` com esquemas, índices e RLS.
  - Funções `SECURITY DEFINER` (`is_admin()`, `is_staff_or_admin()`).
  - Repositórios oficiais do Supabase implementando as interfaces de contrato.
  - Pipeline client-side de imagem: Drag & Drop, Ctrl+V, Canvas resize (1200px max) e WebP 0.82.
- **Quality Gate F4**:
  - Auditoria de segurança de RLS (tentativas de acesso não autorizado bloqueadas).
  - Testes do pipeline de upload e tratamento de erros.
  - Build e tipos 100% OK. Checkpoint Git.

---

## FASE 5 — PAINEL ADMINISTRATIVO & KANBAN EM TEMPO REAL
- **Objetivo**: Criar o painel administrativo protegido, dashboard operacional com métricas, quadro Kanban com transição de status em tempo real (Supabase Realtime), alerta sonoro via Web Audio API, gerenciamento de produtos/categorias e controle de horários da loja.
- **Entregáveis**:
  - Rotas `/admin` protegidas por verificação de perfil de usuário.
  - Quadro Kanban com colunas de status operacionais.
  - Alerta sonoro de novo pedido com sintetizador Web Audio API.
  - Sincronização Realtime (INSERT + UPDATE) entre cliente e painel administrativo.
  - Gestão de produtos, zonas de entrega e horários da loja.
- **Quality Gate F5**:
  - Teste de sincronização em tempo real entre abas/dispositivos.
  - Testes de transição de status do Kanban.
  - Build e tipos 100% OK. Checkpoint Git.

---

## FASE 6 — POLIMENTO, ACESSIBILIDADE, PERFORMANCE & AUDITORIA FINAL
- **Objetivo**: Refinar toda a experiência de usuário com skeletons, empty states, error boundaries, auditoria WCAG 2.1 AA de acessibilidade, otimização de SEO com Schema.org (`Restaurant`, `Menu`), auditoria global de regressão e certificação de prontidão para produção.
- **Entregáveis**:
  - Skeletons e estados vazios humanizados.
  - Metadados de SEO, Open Graph e Schema.org estruturado.
  - Auditoria completa de performance e acessibilidade.
  - Suíte de regressão global aprovada.
  - Documentação atualizada e README completo.
- **Quality Gate F6**:
  - Production Readiness Gate 100% aprovado.
  - Zero vulnerabilidades críticas ou altas.
  - Checkpoint Git final.
