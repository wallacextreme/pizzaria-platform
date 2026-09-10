# Registro de Decisões de Arquitetura (ADRs) — Plataforma de Pizzaria Full-Stack

Este documento registra formalmente as decisões arquiteturais tomadas para garantir estabilidade, segurança, manutenibilidade e conformidade de produção.

---

## ADR 001: Supabase/PostgreSQL como Única Fonte da Verdade
- **Data**: 2026-09-09
- **Status**: Aprovado
- **Contexto**: Sistemas de e-commerce e delivery não podem tolerar inconsistências de estoque, preços adulterados ou status desatualizados.
- **Decisão**: A aplicação de produção utilizará exclusivamente o Supabase/PostgreSQL como fonte autoritativa de dados e estado. Não existirá modo offline concorrente na aplicação de produção.
- **Consequências**: Elimina risco de split-brain ou pedidos com preços desatualizados. Garante que regras de RLS e constraints de banco sejam o árbitro final.

---

## ADR 002: Repositórios Mock Restritos Exclusivamente a Testes Automatizados
- **Data**: 2026-09-09
- **Status**: Aprovado
- **Contexto**: Testes unitários e de integração precisam rodar de forma rápida e determinística sem depender de conexão de rede ou bancos de dados externos.
- **Decisão**: A camada de persistência é desacoplada por interfaces TypeScript (`IProductRepository`, `IOrderRepository`, etc.). As implementações Mock/In-Memory existem exclusivamente para uso nos testes (Vitest) e devem emular com fidelidade as regras e constraints do Supabase real.
- **Consequências**: Testes rápidos, confiáveis e que não afetam o ambiente de produção.

---

## ADR 003: Representação Monetária em Centavos Inteiros
- **Data**: 2026-09-09
- **Status**: Aprovado
- **Contexto**: Operações com números de ponto flutuante (float/double) sofrem com problemas de precisão inerentes ao padrão IEEE 754 (ex: `0.1 + 0.2 = 0.30000000000000004`).
- **Decisão**: Toda quantia financeira (preços, subtotais, taxas, trocos, totais) é obrigatoriamente armazenada e calculada em centavos inteiros (`integer`), sufixados com `_cents`. A formatação em Real (`R$`) ocorre exclusivamente na camada de exibição.
- **Consequências**: Cálculos exatos, determinísticos e sem erros de arredondamento.

---

## ADR 004: RBAC Granular e RLS Desacoplado de `auth.role() = 'authenticated'`
- **Data**: 2026-09-09
- **Status**: Aprovado
- **Contexto**: No Supabase Auth, qualquer usuário que crie uma conta recebe o papel JWT `authenticated`. Se as políticas de RLS ou guards de rota concederem acesso apenas por ser `authenticated`, qualquer cliente cadastrado teria privilégios de funcionário ou administrador.
- **Decisão**: Criar a tabela `user_roles(user_id, role)` com papéis `admin` e `staff`. Funções SQL com `SECURITY DEFINER` (`is_admin()`, `is_staff_or_admin()`) verificarão a autorização nas políticas RLS.
- **Consequências**: Segurança robusta contra escalada de privilégios.

---

## ADR 005: Recálculo Forçado no Backend e Proteção contra Adulteração
- **Data**: 2026-09-09
- **Status**: Aprovado
- **Contexto**: O cliente HTTP pode ser manipulado via DevTools, curl ou scripts para enviar preços com valor zero ou inferior ao real.
- **Decisão**: O backend ignora os preços enviados pelo cliente. A rota `/api/orders` carrega os produtos e adicionais do banco, valida tamanhos e ingredientes, recalcula o subtotal, consulta a taxa da zona de entrega e calcula o total exato.
- **Consequências**: Zero risco de pedidos com valores fraudulentos.

---

## ADR 006: Pipeline de Upload de Imagens com Conversão Client-Side para WebP
- **Data**: 2026-09-09
- **Status**: Aprovado
- **Contexto**: Fotos tiradas de smartphones possuem resoluções de 4K a 8K (5MB a 20MB) e metadados EXIF que oneram o tráfego e representam risco de segurança.
- **Decisão**: Utilizar a Canvas API no navegador para redimensionar proporcionalmente a largura para até 1200px e converter para formato WebP com compressão de qualidade 0.82 antes do upload.
- **Consequências**: Economia de banda e storage de até 85%, carregamento rápido do cardápio e sanitização de metadados antes do envio.

---

## ADR 007: Alerta Sonoro no Kanban com Web Audio API
- **Data**: 2026-09-09
- **Status**: Aprovado
- **Contexto**: Alertas de pedidos novos precisam ser confiáveis, discretos e não falhar por arquivos de áudio não carregados ou bloqueados por CORS.
- **Decisão**: Implementar um sintetizador simples com oscilador e envelope de ganho usando a Web Audio API nativa do navegador para emitir um tom curto e agradável.
- **Consequências**: Zero dependência de arquivos MP3/WAV externos, sem latência de rede.

---

## ADR 008: Estratégia Híbrida Realtime + Polling com Reconciliação Determinística
- **Data**: 2026-09-10
- **Status**: Aprovado
- **Contexto**: O painel da cozinha depende de eventos imediatos para novos pedidos, mas conexões de rede em cozinhas industriais podem sofrer oscilações momentâneas ou quedas de WebSocket. Simples polling de 10s pode competir com Realtime e gerar duplicação de pedidos ou sobrescrita de estados mais novos com dados obsoletos (race conditions).
- **Decisão**: Adotar Supabase Realtime como canal primário de baixa latência e Polling de 10 segundos estritamente como mecanismo de resync e fallback. Implementar a função determinística `reconcileOrders()` que indexa pedidos por UUID e descarta sumariamente qualquer payload de polling cuja data `updated_at` seja anterior ao estado atual da aplicação.
- **Consequências**: Zero duplicação de cards, eliminação de race conditions e garantia de convergência estável mesmo sob reconexões frequentes.

---

## ADR 009: Defesa em Profundidade para Autenticação e RBAC sem Bypasses
- **Data**: 2026-09-10
- **Status**: Aprovado
- **Contexto**: Painéis operacionais não podem tolerar botões de atalho ou simulações que permitam acesso não autenticado, nem confiar exclusivamente em guards de interface (client-side).
- **Decisão**: Remover qualquer mecanismo de mock/bypass do código de produção. Implementar autenticação real via Supabase Auth integrada à tabela `user_roles`. Estabelecer três níveis de barreira: Client Route Guard (`admin/layout.tsx`), Server Guard (`serverAuth.ts`) em todos os Route Handlers administrativos e políticas estritas de RLS no PostgreSQL (com `public.is_staff_or_admin`).
- **Consequências**: Qualquer requisição não autenticada ou sem perfil atribuído em `user_roles` é rejeitada imediatamente com 401 ou 403, tanto na interface quanto nas APIs.

---

## ADR 010: Máquina de Estados Estrita para o Fluxo de Pedidos
- **Data**: 2026-09-10
- **Status**: Aprovado
- **Contexto**: Mudanças arbitrárias de status de pedidos (como pular etapas da cozinha ou regredir pedidos já entregues) causam erros operacionais graves na linha de produção da pizzaria.
- **Decisão**: Definir formalmente a máquina de estados `orderTransitions.ts` com validação obrigatória no servidor (`PATCH /api/orders`). O fluxo é estritamente unidirecional: `novo` → `em_preparo` → `no_forno` → `saiu_para_entrega` → `concluido`. Cancelamento é permitido apenas antes da conclusão. Pedidos `concluido` e `cancelado` são imutáveis.
- **Consequências**: Eliminação de estados arbitrários e consistência total entre tela da cozinha, backend e rastreamento do cliente.
