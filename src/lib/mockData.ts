/**
 * Seed / Mock Data para Catálogo e Construtor de Pizza (Fase 2)
 * 
 * AVISO ARQUITETURAL:
 * Entidades completas com tamanhos, bordas, adicionais e ingredientes removíveis
 * em centavos inteiros (cents), prontas para migração e testes.
 */

import type { StoreSettings, Category, PizzaSize, CrustOption, ExtraOption, Product } from "@/types/domain";

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
    id: "cat-tradicionais",
    name: "Pizzas Tradicionais",
    slug: "tradicionais",
    order_index: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "cat-especiais",
    name: "Pizzas Especiais",
    slug: "especiais",
    order_index: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "cat-doces",
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
  { id: "size-brotinho", name: "Brotinho (4 fatias)", price_cents: 3800, slices: 4, max_flavors: 1 },
  { id: "size-media", name: "Média (6 fatias)", price_cents: 5600, slices: 6, max_flavors: 2 },
  { id: "size-grande", name: "Grande (8 fatias)", price_cents: 7200, slices: 8, max_flavors: 2 },
  { id: "size-familia", name: "Família (12 fatias)", price_cents: 8900, slices: 12, max_flavors: 2 },
];

export const MOCK_CRUSTS: CrustOption[] = [
  { id: "crust-tradicional", name: "Massa Tradicional Crocante", price_cents: 0 },
  { id: "crust-catupiry", name: "Borda Catupiry Original", price_cents: 1200 },
  { id: "crust-cheddar", name: "Borda Cheddar Cremoso", price_cents: 1200 },
  { id: "crust-vulcao", name: "Borda Vulcão Quatro Queijos", price_cents: 1800 },
  { id: "crust-chocolate", name: "Borda Chocolate Meio Amargo", price_cents: 1400 },
];

export const MOCK_EXTRAS: ExtraOption[] = [
  { id: "extra-bacon", name: "Bacon Crocante Extra", price_cents: 800 },
  { id: "extra-queijo", name: "Mussarela Artesanal Dupla", price_cents: 900 },
  { id: "extra-alho", name: "Alho Frito Dourado", price_cents: 400 },
  { id: "extra-parmesao", name: "Lâminas de Parmesão Maturado", price_cents: 850 },
  { id: "extra-tomate-seco", name: "Tomate Seco Confitado", price_cents: 700 },
];

export const MOCK_PRODUCTS: Product[] = [
  // 1. Margherita Especial
  {
    id: "prod-margherita",
    category_id: "cat-tradicionais",
    name: "Margherita Especial",
    slug: "margherita-especial",
    description: "Molho de tomate pelati italiano, mozzarella di bufala fresca, parmesão e folhas frescas de manjericão orgânico.",
    images: ["/images/margherita.webp"],
    sizes: [
      { id: "size-brotinho", name: "Brotinho (4 fatias)", price_cents: 3800, slices: 4, max_flavors: 1 },
      { id: "size-media", name: "Média (6 fatias)", price_cents: 5600, slices: 6, max_flavors: 2 },
      { id: "size-grande", name: "Grande (8 fatias)", price_cents: 7200, slices: 8, max_flavors: 2 },
      { id: "size-familia", name: "Família (12 fatias)", price_cents: 8900, slices: 12, max_flavors: 2 },
    ],
    crust_options: MOCK_CRUSTS,
    extras: MOCK_EXTRAS,
    removable_ingredients: ["manjericão", "parmesão"],
    flags: { is_pizza: true, is_featured: true, badge: "Mais Pedida" },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // 2. Calabresa Artesanal
  {
    id: "prod-calabresa",
    category_id: "cat-tradicionais",
    name: "Calabresa Artesanal Defumada",
    slug: "calabresa-artesanal",
    description: "Calabresa premium fatiada finamente, cebola roxa caramelizada no forno a lenha e azeitonas pretas azapa.",
    images: ["/images/calabresa.webp"],
    sizes: [
      { id: "size-brotinho", name: "Brotinho (4 fatias)", price_cents: 3600, slices: 4, max_flavors: 1 },
      { id: "size-media", name: "Média (6 fatias)", price_cents: 5400, slices: 6, max_flavors: 2 },
      { id: "size-grande", name: "Grande (8 fatias)", price_cents: 6800, slices: 8, max_flavors: 2 },
      { id: "size-familia", name: "Família (12 fatias)", price_cents: 8400, slices: 12, max_flavors: 2 },
    ],
    crust_options: MOCK_CRUSTS,
    extras: MOCK_EXTRAS,
    removable_ingredients: ["cebola roxa", "azeitonas pretas"],
    flags: { is_pizza: true, is_featured: false, badge: "Tradicional" },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // 3. Quatro Queijos Nobres
  {
    id: "prod-quatro-queijos",
    category_id: "cat-tradicionais",
    name: "Quatro Queijos Nobres",
    slug: "quatro-queijos-nobres",
    description: "Mussarela artesanal, gorgonzola dolce, parmesão grana padano e o legítimo Catupiry cremoso.",
    images: ["/images/quatro-queijos.webp"],
    sizes: [
      { id: "size-brotinho", name: "Brotinho (4 fatias)", price_cents: 4200, slices: 4, max_flavors: 1 },
      { id: "size-media", name: "Média (6 fatias)", price_cents: 6200, slices: 6, max_flavors: 2 },
      { id: "size-grande", name: "Grande (8 fatias)", price_cents: 7900, slices: 8, max_flavors: 2 },
      { id: "size-familia", name: "Família (12 fatias)", price_cents: 9500, slices: 12, max_flavors: 2 },
    ],
    crust_options: MOCK_CRUSTS,
    extras: MOCK_EXTRAS,
    removable_ingredients: ["gorgonzola", "catupiry"],
    flags: { is_pizza: true, is_featured: false },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // 4. Frango com Catupiry
  {
    id: "prod-frango-catupiry",
    category_id: "cat-tradicionais",
    name: "Frango com Catupiry Real",
    slug: "frango-catupiry",
    description: "Peito de frango desfiado temperado com ervas finas, coberto com o autêntico requeijão Catupiry.",
    images: ["/images/frango-catupiry.webp"],
    sizes: [
      { id: "size-brotinho", name: "Brotinho (4 fatias)", price_cents: 3900, slices: 4, max_flavors: 1 },
      { id: "size-media", name: "Média (6 fatias)", price_cents: 5800, slices: 6, max_flavors: 2 },
      { id: "size-grande", name: "Grande (8 fatias)", price_cents: 7400, slices: 8, max_flavors: 2 },
      { id: "size-familia", name: "Família (12 fatias)", price_cents: 9100, slices: 12, max_flavors: 2 },
    ],
    crust_options: MOCK_CRUSTS,
    extras: MOCK_EXTRAS,
    removable_ingredients: ["catupiry", "milho"],
    flags: { is_pizza: true, is_featured: false },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // 5. Parma com Rúcula (Especial)
  {
    id: "prod-parma-rucula",
    category_id: "cat-especiais",
    name: "Parma & Grana Padano",
    slug: "parma-grana-padano",
    description: "Presunto cru di Parma maturado 24 meses, folhas frescas de rúcula selvagem, lascas de queijo Grana Padano e redução balsâmica.",
    images: ["/images/parma.webp"],
    sizes: [
      { id: "size-brotinho", name: "Brotinho (4 fatias)", price_cents: 4800, slices: 4, max_flavors: 1 },
      { id: "size-media", name: "Média (6 fatias)", price_cents: 7000, slices: 6, max_flavors: 2 },
      { id: "size-grande", name: "Grande (8 fatias)", price_cents: 8900, slices: 8, max_flavors: 2 },
      { id: "size-familia", name: "Família (12 fatias)", price_cents: 10800, slices: 12, max_flavors: 2 },
    ],
    crust_options: MOCK_CRUSTS,
    extras: MOCK_EXTRAS,
    removable_ingredients: ["rúcula", "redução balsâmica"],
    flags: { is_pizza: true, is_featured: true, badge: "Chef Signature" },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // 6. Cogumelos Trufados (Especial)
  {
    id: "prod-cogumelos-trufados",
    category_id: "cat-especiais",
    name: "Cogumelos Trufados & Brie",
    slug: "cogumelos-trufados",
    description: "Mix de cogumelos Paris e Shimeji salteados na manteiga de ervas, queijo brie derretido e azeite trufado branco.",
    images: ["/images/trufada.webp"],
    sizes: [
      { id: "size-brotinho", name: "Brotinho (4 fatias)", price_cents: 4900, slices: 4, max_flavors: 1 },
      { id: "size-media", name: "Média (6 fatias)", price_cents: 7200, slices: 6, max_flavors: 2 },
      { id: "size-grande", name: "Grande (8 fatias)", price_cents: 9200, slices: 8, max_flavors: 2 },
      { id: "size-familia", name: "Família (12 fatias)", price_cents: 11200, slices: 12, max_flavors: 2 },
    ],
    crust_options: MOCK_CRUSTS,
    extras: MOCK_EXTRAS,
    removable_ingredients: ["azeite trufado"],
    flags: { is_pizza: true, is_featured: false, badge: "Gourmet" },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // 7. Banana com Doce de Leite (Doce)
  {
    id: "prod-banana-doce-leite",
    category_id: "cat-doces",
    name: "Banana Caramelizada & Doce de Leite",
    slug: "banana-doce-de-leite",
    description: "Fatias finas de banana prata assadas no forno a lenha com canela, doce de leite argentino Viçosa e raspas de chocolate branco.",
    images: ["/images/banana.webp"],
    sizes: [
      { id: "size-brotinho", name: "Brotinho (4 fatias)", price_cents: 3600, slices: 4, max_flavors: 1 },
      { id: "size-media", name: "Média (6 fatias)", price_cents: 5200, slices: 6, max_flavors: 2 },
      { id: "size-grande", name: "Grande (8 fatias)", price_cents: 6600, slices: 8, max_flavors: 2 },
    ],
    crust_options: [
      { id: "crust-tradicional", name: "Massa Tradicional", price_cents: 0 },
      { id: "crust-chocolate", name: "Borda Chocolate Meio Amargo", price_cents: 1400 },
    ],
    extras: [],
    removable_ingredients: ["canela", "chocolate branco"],
    flags: { is_pizza: true, is_featured: false, badge: "Sobremesa" },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // 8. Bebidas (Não Pizza)
  {
    id: "prod-coca-cola",
    category_id: "cat-bebidas",
    name: "Coca-Cola Original 2 Litros",
    slug: "coca-cola-2l",
    description: "Garrafa de 2 litros gelada.",
    images: ["/images/coca.webp"],
    sizes: [{ id: "size-padrao", name: "Garrafa 2L", price_cents: 1500, slices: 0, max_flavors: 0 }],
    crust_options: [],
    extras: [],
    removable_ingredients: [],
    flags: { is_pizza: false, is_featured: false },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "prod-guarana",
    category_id: "cat-bebidas",
    name: "Guaraná Antarctica 2 Litros",
    slug: "guarana-2l",
    description: "Garrafa de 2 litros bem gelada.",
    images: ["/images/guarana.webp"],
    sizes: [{ id: "size-padrao", name: "Garrafa 2L", price_cents: 1400, slices: 0, max_flavors: 0 }],
    crust_options: [],
    extras: [],
    removable_ingredients: [],
    flags: { is_pizza: false, is_featured: false },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "prod-cerveja-ipa",
    category_id: "cat-bebidas",
    name: "Cerveja Artesanal IPA 500ml",
    slug: "cerveja-artesanal-ipa",
    description: "Cerveja artesanal com notas cítricas de lúpulo aromático, ideal para acompanhar pizzas assadas a lenha.",
    images: ["/images/ipa.webp"],
    sizes: [{ id: "size-padrao", name: "Garrafa 500ml", price_cents: 2200, slices: 0, max_flavors: 0 }],
    crust_options: [],
    extras: [],
    removable_ingredients: [],
    flags: { is_pizza: false, is_featured: true, badge: "Artesanal" },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];
