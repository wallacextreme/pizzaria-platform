# Plataforma de Pizzaria Full-Stack — Produção

Sistema de e-commerce gastronômico profissional de alta performance para pizzarias artesanais, composto por Área Pública (cardápio interativo, construtor de pizza meio a meio, carrinho e checkout) e Painel Administrativo em tempo real (Kanban de cozinha, alertas sonoros, controle de produtos e horários da loja).

---

## Stack Tecnológica Oficial
- **Frontend**: Next.js (App Router), React 19, TypeScript (Strict Mode), Tailwind CSS, Lucide Icons
- **Backend**: Next.js Route Handlers / Server Actions, Supabase (@supabase/ssr, @supabase/supabase-js)
- **Banco de Dados**: PostgreSQL com Row Level Security (RLS) granular
- **Realtime**: Supabase Realtime (INSERT + UPDATE)
- **Armazenamento**: Supabase Storage (Upload com conversão client-side Canvas para WebP)
- **Autenticação e RBAC**: Supabase Auth com tabela `user_roles` (admin vs staff)
- **Estado Local**: Zustand com persistência controlada
- **Testes**: Vitest (Unitários e Integração)
- **Runtime e Pacotes**: Bun / Node.js 24

---

## Princípios de Engenharia
1. **O Backend é a Única Fonte da Verdade**: O cliente envia apenas intenção. O servidor recalcula todos os preços, adicionais, bordas e taxas a partir do banco de dados.
2. **Moeda em Centavos Inteiros**: Todos os cálculos monetários utilizam `cents` inteiros (ex: R$ 25,90 = `2590`), eliminando discrepâncias de arredondamento por ponto flutuante.
3. **Mocks Restritos a Testes**: Implementações em memória existem exclusivamente para os testes automatizados com Vitest, emulando fielmente as regras do Supabase.
4. **Segurança por Padrão**: Autenticação não concede automaticamente privilégios administrativos. Operações sensíveis são protegidas por funções `SECURITY DEFINER` e RLS.

---

## Instalação e Execução

### 1. Instalar Dependências
```bash
bun install
```
*(ou `npm install`)*

### 2. Configurar Variáveis de Ambiente
Copie o arquivo de exemplo:
```bash
cp .env.example .env.local
```
Preencha suas credenciais do Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://sua-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

### 3. Executar Testes Automatizados
```bash
npm test
```

### 4. Checagens de Tipos e Linter
```bash
npm run typecheck
npm run lint
```

### 5. Compilar para Produção
```bash
npm run build
```

### 6. Executar Servidor Local
```bash
npm run dev
```
Acesse `http://localhost:3000` para a loja pública e `http://localhost:3000/admin` para o painel operacional.

---

## Documentação Viva do Projeto
Toda a documentação técnica e viva é mantida na pasta `docs/`:
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Arquitetura detalhada em camadas e fluxo de dados.
- [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) — Modelo de entidades e esquemas SQL.
- [`docs/BUSINESS_RULES.md`](docs/BUSINESS_RULES.md) — Regras de precificação, meio a meio e horários.
- [`docs/SECURITY.md`](docs/SECURITY.md) — Matriz de permissões RLS, RBAC e mitigação de ameaças.
- [`docs/TEST_PLAN.md`](docs/TEST_PLAN.md) — Pirâmide de testes e cenários de validação.
- [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) — Rastreamento de progresso e Quality Gates.
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — Registros formais de decisões de arquitetura (ADRs).
- [`docs/PHASES.md`](docs/PHASES.md) — Roadmap fase a fase.
- [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md) — Checklist de prontidão para produção.
