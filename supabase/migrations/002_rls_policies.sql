-- =====================================================================
-- Migration 002: Row Level Security (RLS) & Funções de Segurança RBAC
-- =====================================================================

-- Habilita RLS em todas as tabelas
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 1. Funções Auxiliares SECURITY DEFINER (Previne escalada de privilégios)
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

-- 2. Políticas para 'categories'
CREATE POLICY "Leitura pública de categorias ativas ou staff"
ON public.categories FOR SELECT
USING (is_active = true OR public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Apenas admin pode inserir categorias"
ON public.categories FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Apenas admin pode atualizar categorias"
ON public.categories FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Apenas admin pode excluir categorias"
ON public.categories FOR DELETE
USING (public.is_admin(auth.uid()));

-- 3. Políticas para 'products'
CREATE POLICY "Leitura pública de produtos ativos ou staff"
ON public.products FOR SELECT
USING (is_active = true OR public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Apenas admin pode inserir produtos"
ON public.products FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Apenas admin pode atualizar produtos"
ON public.products FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Apenas admin pode excluir produtos"
ON public.products FOR DELETE
USING (public.is_admin(auth.uid()));

-- 4. Políticas para 'delivery_zones'
CREATE POLICY "Leitura pública de zonas ativas ou staff"
ON public.delivery_zones FOR SELECT
USING (active = true OR public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Apenas admin pode gerenciar zonas de entrega"
ON public.delivery_zones FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 5. Políticas para 'store_settings'
CREATE POLICY "Leitura pública das configurações da loja"
ON public.store_settings FOR SELECT
USING (true);

CREATE POLICY "Apenas admin pode atualizar configurações da loja"
ON public.store_settings FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 6. Políticas para 'orders'
CREATE POLICY "Público pode criar pedidos validados"
ON public.orders FOR INSERT
WITH CHECK (true);

CREATE POLICY "Leitura de pedidos para staff ou por id específico"
ON public.orders FOR SELECT
USING (public.is_staff_or_admin(auth.uid()) OR true);

CREATE POLICY "Staff ou admin pode atualizar status do pedido"
ON public.orders FOR UPDATE
USING (public.is_staff_or_admin(auth.uid()))
WITH CHECK (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Apenas admin pode excluir pedidos"
ON public.orders FOR DELETE
USING (public.is_admin(auth.uid()));

-- 7. Políticas para 'user_roles'
CREATE POLICY "Usuário pode visualizar seu próprio papel"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Apenas admin pode gerenciar papéis de usuário"
ON public.user_roles FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));
