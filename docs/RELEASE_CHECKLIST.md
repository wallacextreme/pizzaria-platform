# Checklist de Prontidão para Produção (Production Readiness Gate)

Este checklist estabelece os requisitos obrigatórios e o roteiro de homologação para implantação da plataforma Pizzaria.io em ambiente de produção.

---

## 1. Configuração e Provisionamento Supabase (Staging / Produção)

> [!IMPORTANT]
> **Requisito Mandatório de Infraestrutura**:
> O repositório utiliza variáveis de ambiente com placeholders seguros em `.env.example`. A implantação real exige o provisionamento de um projeto Supabase oficial (Staging ou Produção) e a configuração das credenciais no painel de deploy (Vercel, AWS, GCP ou Docker). Nenhuma credencial real ou chave de produção deve ser commitada no Git.

### Passos de Provisionamento do Supabase:
1. **Criação do Projeto**:
   - Criar uma nova organização e projeto no [Supabase Dashboard](https://supabase.com).
   - Definir uma senha forte para o banco de dados PostgreSQL.
   - Selecionar a região mais próxima dos clientes (ex: `sa-east-1` São Paulo).
2. **Execução Sequencial das Migrações SQL**:
   Executar as migrações localizadas em `supabase/migrations/` no SQL Editor do Supabase na ordem estrita:
   - `001_initial_schema.sql`: Criação das tabelas (`categories`, `products`, `delivery_zones`, `orders`, `store_settings`, `user_roles`), tipos enumerados, índices e triggers de `updated_at`.
   - `002_rls_policies.sql`: Habilitação do Row Level Security (RLS) em todas as tabelas e criação das funções `SECURITY DEFINER` (`is_admin`, `is_staff_or_admin`).
   - `003_seed_data.sql`: Carga inicial de categorias gastronômicas, zonas de entrega e horários de funcionamento padrão da pizzaria.
   - `004_storage_setup.sql`: Criação do bucket de Storage público `products` e suas políticas de segurança.
3. **Configuração de Permissões de Usuários (`user_roles`)**:
   - Cadastrar o e-mail do primeiro administrador via Supabase Auth (Authentication > Users).
   - Inserir a atribuição de perfil no SQL Editor:
     ```sql
     INSERT INTO public.user_roles (user_id, role)
     VALUES ('<UUID-DO-USUARIO-CRIADO>', 'admin')
     ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
     ```
4. **Variáveis de Ambiente Necessárias no Servidor**:
   - `NEXT_PUBLIC_SUPABASE_URL`: URL da API do projeto Supabase (`https://<project-id>.supabase.co`).
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima pública (JWT de cliente).
   - `SUPABASE_SERVICE_ROLE_KEY`: Chave privada Service Role (apenas para o backend do Next.js, com bypass de RLS).
   - `NEXT_PUBLIC_SITE_URL`: URL canônica da aplicação em produção (ex: `https://pizzaria.io`).

---

## 2. Compilação, Tipagem e Qualidade de Código

- [x] **Build de Produção**: `npm run build` finalizado com status de saída 0 e 14 páginas geradas com sucesso.
- [x] **Verificação Estrita de Tipos**: `npm run typecheck` (`tsc --noEmit`) aprovado com 0 erros.
- [x] **Linter**: `npm run lint` (`next lint`) executado sem nenhum warning ou erro.
- [x] **First Load JS Otimizado**: Carregamento dinâmico (`next/dynamic`) em modais pesados (`PizzaBuilderModal` e `CheckoutModal`), mantendo o bundle inicial da Home em apenas 136 kB.
- [x] **Sanitização de Logs**: Nenhum log de console expondo credenciais, chaves ou dados confidenciais de clientes.

---

## 3. Testes Automatizados e Regressão

- [x] **Suíte Completa de Testes**: **149/149 testes passando** em 22 arquivos de teste no Vitest.
- [x] **Cobertura Abrangente**:
  - Testes de precificação gastronômica e meio a meio com regra do maior valor (`pricing.test.ts`).
  - Testes de integridade de pedidos e rejeição anti-tampering (`orderValidator.ts` e `/api/orders`).
  - Testes de controle de horários de funcionamento e overrides manuais (`storeHours.test.ts`).
  - Testes de segurança RBAC e proteção de rotas no servidor (`serverAuth.test.ts`).
  - Testes de transição unidirecional de status no Kanban (`orderTransitions.test.ts`).
  - Testes de reconciliação determinística Realtime + Polling (`orderReconciliation.test.ts`).
  - Testes de processamento client-side de imagem WebP (`imageProcessor.test.ts`).
  - Testes de inspeção de Magic Bytes RIFF/WEBP no upload (`upload/route.test.ts`).
  - Testes de SEO, robots.txt, sitemap.xml e Schema.org (`seo.test.ts`).
  - Testes de Manifesto PWA (`manifest.test.ts`).

---

## 4. Segurança e Integridade de Dados

- [x] **Row Level Security (RLS)**: Habilitado e auditado em todas as tabelas.
- [x] **Funções de Segurança**: `is_admin()` e `is_staff_or_admin()` executadas com `SECURITY DEFINER` e `search_path = public`.
- [x] **Multi-layer Defense**:
  - Camada 1: Client guard em `src/app/admin/layout.tsx`.
  - Camada 2: Server guard em `src/lib/auth/serverAuth.ts` validando papéis reais em `user_roles`.
  - Camada 3: Políticas RLS do PostgreSQL no banco de dados.
- [x] **Anti-Tampering no Checkout**: O cliente pode enviar dados no carrinho, mas o servidor recalcula integralmente todos os centavos com base no catálogo oficial e zonas de entrega ativas.
- [x] **Proteção de Upload**: Validação estrita de Magic Bytes (`RIFF` e `WEBP`) e tamanho máximo de 5MB por requisição.

---

## 5. Experiência de Usuário (UX), Acessibilidade & Mobile

- [x] **Estados de UI Completos**:
  - Loading skeletons e spinners para carregamento de página e ações assíncronas (`src/app/loading.tsx`).
  - Error boundaries com botão de retry amigável (`src/app/error.tsx`).
  - Página 404 temática gastronômica com link de retorno (`src/app/not-found.tsx`).
  - Empty states claros e acolhedores no carrinho, busca de produtos e colunas do Kanban.
- [x] **Acessibilidade WCAG 2.1 AA**:
  - Touch targets mínimos de $44 \times 44\text{px}$ em todos os botões e links navegáveis em mobile.
  - Atributos `aria-labelledby`, `aria-describedby` e suporte nativo a fechamento com tecla `Escape` em modais e drawers.
  - Rótulos descritivos (`aria-label`) em todos os botões de ícone (carrinho, menu, remover item).
  - Alto contraste de foco visível (`focus-visible:ring-2 focus-visible:ring-pizza-terracotta`).
- [x] **Responsividade Multi-dispositivo**:
  - Testado e validado em 360px, 390px, 768px, 1024px e 1440px+.
  - Barra de navegação inferior fixa para dispositivos móveis (`BottomNav.tsx`).
  - Ausência total de overflow ou scroll horizontal indesejado.

---

## 6. SEO, PWA & Performance

- [x] **SEO Técnico**:
  - Metadados completos com Open Graph, Twitter Cards, idioma `pt-BR` e canonical URL.
  - Geração dinâmica de `robots.txt` (`src/app/robots.ts`) bloqueando `/admin` e `/api` e liberando `/` e `/pedido/*`.
  - Geração dinâmica de `sitemap.xml` (`src/app/sitemap.ts`).
  - Dados estruturados Schema.org JSON-LD para `Restaurant` e `Menu` incorporados no `<head>` do `RootLayout`.
- [x] **PWA Readiness**:
  - Manifesto Web (`src/app/manifest.ts`) com `name`, `short_name`, `start_url`, `display: standalone`, `theme_color` e ícones SVG/PNG.
  - Tag de meta `viewport` e `themeColor` configurados nativamente via Next.js 15.

---

## 7. Checklist de Verificação do Banco de Dados PostgreSQL

- [x] **Tabelas Core**: `categories`, `products`, `delivery_zones`, `orders`, `store_settings`, `user_roles` criadas e estruturadas.
- [x] **Constraints & Checks**:
  - `orders.status IN ('novo', 'em_preparo', 'no_forno', 'saiu_para_entrega', 'concluido', 'cancelado')`
  - `orders.delivery_type IN ('delivery', 'retirada')`
  - `orders.payment_method IN ('pix', 'cartao_credito', 'cartao_debito', 'dinheiro')`
  - `user_roles.role IN ('admin', 'staff')`
- [x] **Índices**: Índices criados em chaves de alto volume (`orders.status`, `orders.created_at`, `products.category_id`, `products.is_active`).
- [x] **Foreign Keys**: Relacionamentos íntegros (`products.category_id` -> `categories.id`, `user_roles.user_id` -> `auth.users.id`).
- [x] **Triggers Automáticos**: Função e triggers `handle_updated_at` vinculados em todas as tabelas para auditoria temporal precisa.
- [x] **Políticas RLS & Funções de Segurança**: RLS ativo com funções `is_admin()` e `is_staff_or_admin()` utilizando `SECURITY DEFINER`.
- [x] **Publicação Realtime**: Tabela `orders` inclusa na publicação `supabase_realtime` para notificações reativas da cozinha.

---

## 8. Status de Release e Prontidão

| Dimensão | Classificação | Detalhes |
| :--- | :---: | :--- |
| **Código e Aplicação** | **`CODE READY`** | 100% dos testes passando (149/149), TypeScript, ESLint e build de produção aprovados. |
| **Endpoint de Testes** | **`SECURE (404 IN PROD)`** | `/api/auth/test-session` desabilitado em `NODE_ENV === "production"`. |
| **Infraestrutura Cloud** | **`PENDING PROVISIONING`** | Exige provisionamento real da instância Supabase de produção e injeção de credenciais de host. |
| **Status Oficial** | **`CODE READY`** | O código está pronto para lançamento. O estado passará a `PRODUCTION READY` após a conexão com a infraestrutura Supabase real. |
