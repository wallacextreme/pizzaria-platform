# Guia de Implantação e Deploy em Produção — Pizzaria.io

Este documento estabelece o procedimento operacional padrão (POP) para o deploy da plataforma **Pizzaria.io** em ambientes de Staging e Produção.

---

## 1. Requisitos de Sistema

- **Runtime**: Node.js v20.x, v22.x ou Bun v1.2+
- **Gerenciador de Pacotes**: `npm`, `pnpm` ou `bun`
- **Banco de Dados & Auth**: Instância Supabase (PostgreSQL 15+)
- **Plataforma de Hospedagem Recomendada**: Vercel, AWS Amplify, Google Cloud Run ou contêiner Docker (Node.js standalone)

---

## 2. Ambientes e Variáveis de Ambiente

> [!WARNING]
> A chave `SUPABASE_SERVICE_ROLE_KEY` possui privilégios de superusuário e bypass de RLS. **JAMAIS** a configure com o prefixo `NEXT_PUBLIC_` e **JAMAIS** a exponha no código client-side.

### A. Tabela de Variáveis de Ambiente

| Variável | Escopo | Obrigatória | Descrição | Exemplo |
| :--- | :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Público (Browser + Server) | Sim | URL base do projeto Supabase | `https://xyzproject.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Público (Browser + Server) | Sim | Chave anônima JWT com RLS | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Privado (Server-Only) | Sim | Chave administrativa com bypass de RLS | `eyJhbGciOi...` |
| `NEXT_PUBLIC_SITE_URL` | Público (Browser + Server) | Sim | URL canônica de produção para SEO | `https://pizzaria.io` |
| `NEXT_PUBLIC_APP_URL` | Público (Browser + Server) | Opcional | URL base da aplicação web | `https://pizzaria.io` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Público (Browser + Server) | Sim | Telefone da pizzaria para pedidos WhatsApp | `5511999998888` |
| `NODE_ENV` | Sistema | Sim | Modo de execução (`production`) | `production` |

### B. Configuração por Ambiente

#### 1. Desenvolvimento Local
Criar `.env.local` a partir de `.env.example`:
```bash
cp .env.example .env.local
```

#### 2. Staging / Homologação
Configurar as variáveis no dashboard da Vercel / CI-CD apontando para a instância Supabase de Staging:
```env
NEXT_PUBLIC_SUPABASE_URL=https://staging-proj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...staging-anon...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...staging-service...
NEXT_PUBLIC_SITE_URL=https://staging.pizzaria.io
NEXT_PUBLIC_WHATSAPP_NUMBER=5511999998888
NODE_ENV=production
```

#### 3. Produção Oficial
Configurar no provedor de deploy (Environment Variables da Vercel ou Docker Secrets) com as credenciais definitivas do Supabase de Produção.

---

## 3. Provisionamento e Configuração do Supabase

Siga esta sequência estrita no painel do Supabase:

### Passo 1: Criar o Projeto
1. Acesse o [Supabase Dashboard](https://supabase.com).
2. Crie um novo projeto, defina o nome (ex: `pizzaria-producao`) e gere uma senha segura para o banco.
3. Selecione a região mais próxima do público (ex: `sa-east-1` — São Paulo).

### Passo 2: Executar as Migrações SQL
No menu **SQL Editor**, execute sequencialmente o conteúdo dos 4 arquivos de migração:
1. `supabase/migrations/001_initial_schema.sql`
   - Cria as tabelas `categories`, `products`, `delivery_zones`, `orders`, `store_settings`, `user_roles`.
   - Cria tipos enumerados (`delivery_type_enum`, `payment_method_enum`, `order_status_enum`, `user_role_enum`, etc.).
   - Cria os triggers automáticos de `updated_at`.
2. `supabase/migrations/002_rls_policies.sql`
   - Habilita RLS em todas as tabelas.
   - Cria as funções de segurança `public.is_admin(uid)` e `public.is_staff_or_admin(uid)` com `SECURITY DEFINER`.
   - Configura as políticas de acesso e proteção de dados.
3. `supabase/migrations/003_seed_data.sql`
   - Popula as categorias padrão, zonas de entrega e horários de funcionamento da loja.
4. `supabase/migrations/004_storage_setup.sql`
   - Cria o bucket de Storage `products` com acesso público para leitura e restrição de escrita para administradores/service role.

### Passo 3: Habilitar o Supabase Realtime
No menu **Database > Publications**, certifique-se de que a tabela `orders` está incluída na publicação `supabase_realtime`:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
```

### Passo 4: Criar o Primeiro Usuário Administrador
1. No menu **Authentication > Users**, clique em **Add User** (Create User).
2. Forneça o e-mail administrativo (ex: `admin@pizzaria.io`) e uma senha temporária forte.
3. Copie o `User UID` gerado.
4. No **SQL Editor**, atribua o papel `admin`:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('COLE_AQUI_O_UUID_DO_USUARIO', 'admin')
   ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
   ```

---

## 4. Procedimento de Build e Deploy

### A. Deploy via Vercel (Recomendado)
1. Conecte o repositório Git ao projeto Vercel.
2. Defina o Framework Preset como **Next.js**.
3. Adicione todas as variáveis de ambiente descritas na Seção 2.
4. Dispare o deploy. O comando de compilação padrão executará:
   ```bash
   npm run build
   ```

### B. Deploy via Docker
Caso utilize contêiner, use o Dockerfile padrão do Next.js standalone:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 5. Roteiro de Smoke Test Pós-Deploy

Após a conclusão da implantação, execute o checklist rápido de validação:

1. **Catálogo Público**:
   - Acesse `https://sua-url/` e verifique o carregamento das pizzas, categorias e preços.
2. **Construtor de Pizza**:
   - Abra uma pizza, selecione meio a meio com outro sabor, escolha borda e adicione ao carrinho.
3. **Checkout e Anti-Tampering**:
   - Digite um CEP real e verifique se o preenchimento automático funciona.
   - Finalize o pedido e verifique o redirecionamento para `/pedido/[id]`.
4. **Painel Administrativo**:
   - Acesse `https://sua-url/admin` e confirme que o redirecionamento para `/admin/login` é acionado.
   - Efetue login com o usuário criado e confirme o acesso ao Kanban.
   - Confirme a presença do novo pedido na coluna "Novos Pedidos".
   - Altere o status para "Em Preparo" e "No Forno".
5. **Segurança de Endpoints de Teste**:
   - Acesse `https://sua-url/api/auth/test-session`.
   - **DEVE RETORNAR STATUS 404 NOT FOUND**.

---

## 6. Plano de Rollback

Em caso de incidente crítico em produção:

1. **Rollback de Aplicação Web**:
   - No painel da Vercel: acessar **Deployments**, localizar o deploy anterior aprovado e clicar em **Instant Rollback**.
   - No Docker: realizar redeploy da tag da imagem Docker anterior.
2. **Rollback de Banco de Dados**:
   - Caso uma migração recente precise ser desfeita, execute os scripts de `DROP` correspondentes mantendo a integridade das tabelas core (`orders`, `products`).
   - Restaure o snapshot de backup do banco de dados no Supabase Dashboard (**Database > Backups**).
