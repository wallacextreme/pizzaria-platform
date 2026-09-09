# Status do Projeto — Plataforma de Pizzaria Full-Stack

**Última Atualização**: 2026-09-09
**Fase Atual**: FASE 0 — INSPEÇÃO, DOCUMENTAÇÃO VIVA E ARQUITETURA
**Status Geral**: FASE 0 CONCLUÍDA E APROVADA (Gate F0: PASS)

---

## 1. Visão Geral das Fases

| Fase | Título | Status | Gate de Qualidade |
| :--- | :--- | :--- | :--- |
| **Fase 0** | Inspeção + Arquitetura + Baseline | **CONCLUÍDA** | **PASS** |
| **Fase 1** | Foundation + Design System Gastronômico | **PRONTO PARA INICIAR** | Pendente execução |
| **Fase 2** | Cardápio + Construtor de Pizza + Carrinho | PENDENTE | Bloqueado por Gate F1 |
| **Fase 3** | Checkout + Anti-Tampering + WhatsApp | PENDENTE | Bloqueado por Gate F2 |
| **Fase 4** | Backend Supabase + RLS + Storage WebP | PENDENTE | Bloqueado por Gate F3 |
| **Fase 5** | Admin + Kanban Realtime + Alerta Sonoro | PENDENTE | Bloqueado por Gate F4 |
| **Fase 6** | Polimento + Acessibilidade + Auditoria 10/10 | PENDENTE | Bloqueado por Gate F5 |

---

## 2. Checklist do Gate F0 (Critérios de Aceite Validados)

- [x] Inspeção do ambiente (Node v24.18.0, Bun v1.3.14, Git v2.55.0)
- [x] Criação da estrutura do projeto em `C:\Users\Usu\.gemini\antigravity-ide\scratch\pizzaria-platform`
- [x] Documentação viva em `docs/` estruturada e preenchida:
  - `docs/ARCHITECTURE.md`
  - `docs/DATA_MODEL.md`
  - `docs/BUSINESS_RULES.md`
  - `docs/SECURITY.md`
  - `docs/TEST_PLAN.md`
  - `docs/PROJECT_STATUS.md`
  - `docs/DECISIONS.md`
  - `docs/PHASES.md`
  - `docs/RELEASE_CHECKLIST.md`
- [x] Configuração do projeto Next.js 15 + React 19 + TypeScript strict + Tailwind CSS + Vitest
- [x] Tipos de domínio centrais com valores monetários em centavos inteiros (`src/types/domain.ts`)
- [x] Contratos formais de repositório DAO (`src/repositories/interfaces.ts`)
- [x] Módulo utilitário e suíte de testes unitários para centavos/moeda (`src/domain/currency.ts` e `currency.test.ts`)
- [x] Vitest executado: 100% de testes passando (5/5)
- [x] TypeScript estrito validado sem erros (`tsc --noEmit`)
- [x] Compilação de produção Next.js validada com sucesso (`next build` / `bun run build`)
- [x] Checkpoint Git registrado (`feat: implementa fase 00 - baseline de arquitetura e documentacao viva`)

---

## 3. Riscos Identificados e Mitigações Registradas

1. **Risco de Divergência entre Mock de Testes e Supabase Real**:
   - *Mitigação*: Interfaces estritas compartilhadas e mocks espelhando comportamento e erros do PostgreSQL.
2. **Risco de Tentativa de Manipulação de Preços no Checkout**:
   - *Mitigação*: Recálculo obrigatório e integral no backend na rota `/api/orders`.
3. **Risco de Acesso Administrativo Indevido**:
   - *Mitigação*: RBAC isolado de `authenticated` via tabela `user_roles` e funções `SECURITY DEFINER` (`is_admin()`).
