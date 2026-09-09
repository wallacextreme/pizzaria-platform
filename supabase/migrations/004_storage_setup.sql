-- =====================================================================
-- Migration 004: Supabase Storage — Bucket 'products' e Políticas de Acesso
-- =====================================================================

-- 1. Criação do Bucket 'products' como público para visualização das fotos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  5242880, -- 5MB após processamento WebP no cliente
  ARRAY['image/webp', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/webp', 'image/png', 'image/jpeg'];

-- 2. Políticas de Leitura Pública no Storage
CREATE POLICY "Imagens de produtos são publicamente acessíveis"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- 3. Políticas de Upload (INSERT) restritas a Staff ou Admin
CREATE POLICY "Apenas staff ou admin pode fazer upload de imagens de produtos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products' AND
  (public.is_staff_or_admin(auth.uid()) OR auth.role() = 'service_role')
);

-- 4. Políticas de Atualização (UPDATE) restritas a Staff ou Admin
CREATE POLICY "Apenas staff ou admin pode atualizar imagens de produtos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'products' AND
  (public.is_staff_or_admin(auth.uid()) OR auth.role() = 'service_role')
)
WITH CHECK (
  bucket_id = 'products' AND
  (public.is_staff_or_admin(auth.uid()) OR auth.role() = 'service_role')
);

-- 5. Políticas de Exclusão (DELETE) restritas a Staff ou Admin
CREATE POLICY "Apenas staff ou admin pode excluir imagens de produtos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products' AND
  (public.is_staff_or_admin(auth.uid()) OR auth.role() = 'service_role')
);
