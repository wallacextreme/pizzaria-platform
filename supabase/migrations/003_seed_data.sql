-- =====================================================================
-- Migration 003: Dados Iniciais (Seed) — Plataforma de Pizzaria Full-Stack
-- =====================================================================

-- Inserção de Categorias
INSERT INTO public.categories (id, name, slug, order_index, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'Pizzas Tradicionais', 'tradicionais', 0, true),
('22222222-2222-2222-2222-222222222222', 'Pizzas Especiais', 'especiais', 1, true),
('33333333-3333-3333-3333-333333333333', 'Pizzas Doces', 'doces', 2, true),
('44444444-4444-4444-4444-444444444444', 'Bebidas', 'bebidas', 3, true)
ON CONFLICT (slug) DO NOTHING;

-- Inserção de Configurações da Loja (Singleton)
INSERT INTO public.store_settings (
    id,
    operating_hours,
    manual_override,
    whatsapp_number,
    half_and_half_pricing_rule,
    delivery_settings
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    '[
        {"day_of_week": 0, "is_open": true, "intervals": [{"start": "18:00", "end": "23:30"}]},
        {"day_of_week": 1, "is_open": false, "intervals": []},
        {"day_of_week": 2, "is_open": true, "intervals": [{"start": "18:00", "end": "23:30"}]},
        {"day_of_week": 3, "is_open": true, "intervals": [{"start": "18:00", "end": "23:30"}]},
        {"day_of_week": 4, "is_open": true, "intervals": [{"start": "18:00", "end": "23:30"}]},
        {"day_of_week": 5, "is_open": true, "intervals": [{"start": "18:00", "end": "02:00"}]},
        {"day_of_week": 6, "is_open": true, "intervals": [{"start": "18:00", "end": "02:00"}]}
    ]'::jsonb,
    'auto',
    '5511999999999',
    'maior_valor',
    '{"min_order_cents": 3000, "default_estimated_time_min": 45}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Inserção de Zonas de Entrega
INSERT INTO public.delivery_zones (neighborhood, fee_cents, estimated_time_minutes, active) VALUES
('Vila Gastronômica', 500, 35, true),
('Centro Histórico', 700, 40, true),
('Jardim das Flores', 900, 45, true),
('Bairro Alto', 1200, 50, true),
('Parque das Nações', 1500, 55, true)
ON CONFLICT (neighborhood) DO UPDATE 
SET fee_cents = EXCLUDED.fee_cents, estimated_time_minutes = EXCLUDED.estimated_time_minutes;
