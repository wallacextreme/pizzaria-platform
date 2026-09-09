# Modelo de Dados — PostgreSQL / Supabase

## 1. Convenções
- **Chaves Primárias**: UUID v4 (`gen_random_uuid()`).
- **Valores Monetários**: Sempre em centavos inteiros (`integer`), sufixados com `_cents` (`price_cents`, `subtotal_cents`, `delivery_fee_cents`, `total_cents`, `change_for_cents`).
- **Datas e Timestamps**: `timestamptz` em UTC.
- **Identificadores Públicos**: `orders.id` (UUID) e `orders.display_id` (código legível curto como `#PZ-1024`).

---

## 2. Esquema Físico das Tabelas

### `categories`
```sql
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `products`
```sql
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    images JSONB NOT NULL DEFAULT '[]'::jsonb,
    sizes JSONB NOT NULL DEFAULT '[]'::jsonb,
    crust_options JSONB NOT NULL DEFAULT '[]'::jsonb,
    extras JSONB NOT NULL DEFAULT '[]'::jsonb,
    removable_ingredients TEXT[] NOT NULL DEFAULT '{}',
    flags JSONB NOT NULL DEFAULT '{"is_pizza": false, "is_featured": false}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_is_active ON public.products(is_active);
```

### Estrutura de JSONB de `products`:
- **`sizes`**:
  ```json
  [
    { "id": "size-brotinho", "name": "Brotinho (4 fatias)", "price_cents": 3500, "slices": 4, "max_flavors": 1 },
    { "id": "size-media", "name": "Média (6 fatias)", "price_cents": 5500, "slices": 6, "max_flavors": 2 },
    { "id": "size-grande", "name": "Grande (8 fatias)", "price_cents": 7200, "slices": 8, "max_flavors": 2 },
    { "id": "size-familia", "name": "Família (12 fatias)", "price_cents": 8900, "slices": 12, "max_flavors": 2 }
  ]
  ```
- **`crust_options`**:
  ```json
  [
    { "id": "crust-tradicional", "name": "Massa Tradicional", "price_cents": 0 },
    { "id": "crust-catupiry", "name": "Borda Recheada com Catupiry", "price_cents": 1200 },
    { "id": "crust-cheddar", "name": "Borda Recheada com Cheddar", "price_cents": 1200 },
    { "id": "crust-vulcao", "name": "Borda Vulcão Quatro Queijos", "price_cents": 1800 }
  ]
  ```
- **`extras`**:
  ```json
  [
    { "id": "extra-bacon", "name": "Bacon Crocante Extra", "price_cents": 800 },
    { "id": "extra-queijo", "name": "Queijo Mussarela Duplo", "price_cents": 900 }
  ]
  ```

### `delivery_zones`
```sql
CREATE TABLE public.delivery_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    neighborhood TEXT NOT NULL UNIQUE,
    fee_cents INTEGER NOT NULL CHECK (fee_cents >= 0),
    estimated_time_minutes INTEGER NOT NULL CHECK (estimated_time_minutes > 0),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `orders`
```sql
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('novo', 'em_preparo', 'no_forno', 'saiu_para_entrega', 'concluido', 'cancelado')),
    customer JSONB NOT NULL,
    delivery_type TEXT NOT NULL CHECK (delivery_type IN ('delivery', 'retirada')),
    address JSONB,
    items JSONB NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'cartao', 'dinheiro')),
    change_for_cents INTEGER CHECK (change_for_cents IS NULL OR change_for_cents >= 0),
    delivery_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (delivery_fee_cents >= 0),
    subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
    total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
    fulfillment_channel TEXT NOT NULL CHECK (fulfillment_channel IN ('web', 'whatsapp')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
```

### `store_settings` (Singleton)
```sql
CREATE TABLE public.store_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operating_hours JSONB NOT NULL,
    manual_override TEXT NOT NULL DEFAULT 'auto' CHECK (manual_override IN ('auto', 'aberto', 'fechado')),
    whatsapp_number TEXT NOT NULL,
    half_and_half_pricing_rule TEXT NOT NULL DEFAULT 'maior_valor' CHECK (half_and_half_pricing_rule IN ('maior_valor', 'media_ponderada')),
    delivery_settings JSONB NOT NULL DEFAULT '{"min_order_cents": 3000, "default_estimated_time_min": 45}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `user_roles`
```sql
CREATE TABLE public.user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
