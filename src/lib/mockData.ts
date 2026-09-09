/**
 * Seed / Mock Data para Demonstração da Fase 1
 * 
 * AVISO ARQUITETURAL:
 * Este arquivo contém dados de demonstração e fixtures para visualização da Fundação e Design System.
 * Não substitui o banco de dados oficial do Supabase.
 */

import type { StoreSettings, Category, PizzaSize } from "@/types/domain";

export const MOCK_STORE_SETTINGS: StoreSettings = {
  id: "store-singleton-id",
  operating_hours: [
    {
      day_of_week: 0,
      is_open: true,
      intervals: [{ start: "18:00", end: "23:30" }],
    },
    {
      day_of_week: 1,
      is_open: false,
      intervals: [],
    },
    {
      day_of_week: 2,
      is_open: true,
      intervals: [{ start: "18:00", end: "23:30" }],
    },
    {
      day_of_week: 3,
      is_open: true,
      intervals: [{ start: "18:00", end: "23:30" }],
    },
    {
      day_of_week: 4,
      is_open: true,
      intervals: [{ start: "18:00", end: "23:30" }],
    },
    {
      day_of_week: 5,
      is_open: true,
      intervals: [{ start: "18:00", end: "02:00" }],
    },
    {
      day_of_week: 6,
      is_open: true,
      intervals: [{ start: "18:00", end: "02:00" }],
    },
  ],
  manual_override: "auto",
  whatsapp_number: "5511999999999",
  half_and_half_pricing_rule: "maior_valor",
  delivery_settings: {
    min_order_cents: 3000,
    default_estimated_time_min: 45,
  },
  updated_at: new Date().toISOString(),
};

export const MOCK_CATEGORIES: Category[] = [
  {
    id: "cat-pizzas-tradicionais",
    name: "Pizzas Tradicionais",
    slug: "tradicionais",
    order_index: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "cat-pizzas-especiais",
    name: "Pizzas Especiais",
    slug: "especiais",
    order_index: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "cat-pizzas-doces",
    name: "Pizzas Doces",
    slug: "doces",
    order_index: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "cat-bebidas",
    name: "Bebidas",
    slug: "bebidas",
    order_index: 3,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const MOCK_SIZES: PizzaSize[] = [
  { id: "size-brotinho", name: "Brotinho (4 fatias)", price_cents: 3500, slices: 4, max_flavors: 1 },
  { id: "size-media", name: "Média (6 fatias)", price_cents: 5500, slices: 6, max_flavors: 2 },
  { id: "size-grande", name: "Grande (8 fatias)", price_cents: 7200, slices: 8, max_flavors: 2 },
  { id: "size-familia", name: "Família (12 fatias)", price_cents: 8900, slices: 12, max_flavors: 2 },
];
