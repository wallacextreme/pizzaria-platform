# Diretrizes de Segurança — Plataforma de Pizzaria Full-Stack

## 1. Princípios de Segurança e Confiança Zero

1. **Backend Autorizado**: O cliente nunca é tratado como confiável. Todos os dados de entrada de checkout, preços e uploads são validados no servidor.
2. **Segredos Protegidos**: A chave `SUPABASE_SERVICE_ROLE_KEY` é de uso exclusivo dos Route Handlers / Server Actions no servidor. **NUNCA** deve ser exposta no client ou com prefixo `NEXT_PUBLIC_`.
3. **Autenticação NÃO é Autorização**: Usuário autenticado pelo Supabase Auth não ganha automaticamente privilégios administrativos. O acesso administrativo é explicitamente validado na tabela `user_roles`.

---

## 2. Controle de Acesso Baseado em Funções (RBAC)

Definimos três papéis de acesso:
- **`anon` (Público)**: Visitantes do cardápio, criação de pedidos e consulta do status de seu próprio pedido.
- **`staff` (Cozinha/Atendimento)**: Acesso ao Kanban e atualização de status operacional de pedidos. Não pode alterar produtos, preços ou configurações gerais da loja.
- **`admin` (Gestor/Proprietário)**: Acesso total (CRUD de produtos, categorias, zonas de entrega, horários, relatórios e gestão de usuários).

### Funções de Segurança em Banco de Dados (`SECURITY DEFINER`):
```sql
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = uid AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff_or_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = uid AND role IN ('admin', 'staff')
  );
$$;
```

---

## 3. Matriz de Políticas Row Level Security (RLS)

### `categories`
- `SELECT`: `is_active = true OR is_staff_or_admin(auth.uid())`
- `INSERT`, `UPDATE`, `DELETE`: `is_admin(auth.uid())`

### `products`
- `SELECT`: `is_active = true OR is_staff_or_admin(auth.uid())`
- `INSERT`, `UPDATE`, `DELETE`: `is_admin(auth.uid())`

### `delivery_zones`
- `SELECT`: `active = true OR is_staff_or_admin(auth.uid())`
- `INSERT`, `UPDATE`, `DELETE`: `is_admin(auth.uid())`

### `store_settings`
- `SELECT`: `true` (visível publicamente para horários e status)
- `UPDATE`: `is_admin(auth.uid())`

### `orders`
- `INSERT`: `true` (via Server Route com validação estrita ou anônimo com payload seguro)
- `SELECT`: `is_staff_or_admin(auth.uid()) OR id = current_setting('request.headers', true)::json->>'x-order-token'::uuid` (ou via API com order_id)
- `UPDATE`: `is_staff_or_admin(auth.uid())` (para alteração de status)
- `DELETE`: `is_admin(auth.uid())`

---

## 4. Proteção de Endpoints e Validação de Payload
- **Validação com Zod**: Schemas estritos para todas as requisições `/api/orders`. Parâmetros inesperados sofrem `strip` ou rejeição.
- **Prevenção contra Adulteração de Preços**: Valores como `subtotal`, `delivery_fee` e `total` enviados pelo navegador são ignorados e recalculados pelo servidor.
- **Sanitização**: Strings enviadas pelo usuário (nomes, observações, complementos) são limpas contra XSS e injeções.
- **Rate Limiting e Idempotência**: Prevenção de pedidos duplicados por duplo clique usando idempotency token gerado no início do checkout.

---

## 5. Segurança no Pipeline de Upload de Imagens
- **Client-Side Canvas Sanitization**: Ao carregar a imagem no elemento Canvas, converter para WebP e redesenhar os pixels, qualquer payload oculto em EXIF, metadados JPEG ou scripts embutidos é neutralizado.
- **Validação de MIME Type e Tamanho**: Rejeição imediata de arquivos que não sejam `image/png`, `image/jpeg` ou `image/webp`, com limite de 10MB antes da conversão.
- **Storage Policies no Supabase**: Upload para o bucket `products` permitido apenas para usuários com função `is_admin()`.
