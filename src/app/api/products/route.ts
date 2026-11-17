import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { getCatalogStore } from "@/lib/mockData";
import type { PizzaSize, Product } from "@/types/domain";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

const sizeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price_cents: z.number().int().positive(),
  slices: z.number().int().nonnegative(),
  max_flavors: z.number().int().nonnegative(),
});

const createProductSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(4).max(500),
  category_id: z.string().min(1),
  is_pizza: z.boolean(),
  base_price_cents: z.number().int().positive(),
  images: z.array(z.string().min(1)).default([]),
  removable_ingredients: z.array(z.string()).default([]),
  flags: z
    .object({
      is_featured: z.boolean().optional(),
      vegetarian: z.boolean().optional(),
      spicy: z.boolean().optional(),
      badge: z.string().optional(),
    })
    .optional(),
});

const patchProductSchema = z.object({
  id: z.string().min(1),
  is_active: z.boolean().optional(),
  name: z.string().min(2).max(120).optional(),
  description: z.string().min(4).max(500).optional(),
  category_id: z.string().min(1).optional(),
  images: z.array(z.string().min(1)).optional(),
  sizes: z.array(sizeSchema).min(1).optional(),
  removable_ingredients: z.array(z.string()).optional(),
  flags: z
    .object({
      is_pizza: z.boolean(),
      is_featured: z.boolean(),
      vegetarian: z.boolean().optional(),
      spicy: z.boolean().optional(),
      badge: z.string().optional(),
    })
    .optional(),
});

function buildSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildPizzaSizes(baseCents: number): PizzaSize[] {
  return [
    {
      id: "size-brotinho",
      name: "Brotinho (4 fatias)",
      price_cents: Math.round((baseCents * 0.55) / 100) * 100,
      slices: 4,
      max_flavors: 1,
    },
    {
      id: "size-media",
      name: "Média (6 fatias)",
      price_cents: Math.round((baseCents * 0.8) / 100) * 100,
      slices: 6,
      max_flavors: 2,
    },
    {
      id: "size-grande",
      name: "Grande (8 fatias)",
      price_cents: baseCents,
      slices: 8,
      max_flavors: 2,
    },
    {
      id: "size-familia",
      name: "Família (12 fatias)",
      price_cents: Math.round((baseCents * 1.24) / 100) * 100,
      slices: 12,
      max_flavors: 2,
    },
  ];
}

export async function GET() {
  const store = getCatalogStore();
  return NextResponse.json(
    {
      success: true,
      products: store.products,
      categories: store.categories,
    },
    { headers: NO_STORE_HEADERS }
  );
}

export async function POST(request: Request) {
  const auth = await authenticateServerRequest(request, "admin");
  if (!auth.success) {
    return auth.response;
  }

  try {
    const raw = await request.json();
    const parsed = createProductSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Dados inválidos para criação de produto." },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const store = getCatalogStore();
    const now = new Date().toISOString();
    const baseSlug = buildSlug(data.name) || "item";
    const newProduct: Product = {
      id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      category_id: data.category_id,
      name: data.name.trim(),
      slug: `${baseSlug}-${Math.random().toString(36).slice(2, 5)}`,
      description: data.description.trim(),
      images:
        data.images.length > 0
          ? data.images
          : [data.is_pizza ? "/images/margherita.webp" : "/images/coca.webp"],
      sizes: data.is_pizza
        ? buildPizzaSizes(data.base_price_cents)
        : [
            {
              id: "size-padrao",
              name: "Unidade",
              price_cents: data.base_price_cents,
              slices: 0,
              max_flavors: 0,
            },
          ],
      crust_options: data.is_pizza && store.products[0]?.crust_options
        ? store.products[0].crust_options
        : [],
      extras: data.is_pizza && store.products[0]?.extras
        ? store.products[0].extras
        : [],
      removable_ingredients: data.removable_ingredients,
      flags: {
        is_pizza: data.is_pizza,
        is_featured: Boolean(data.flags?.is_featured),
        vegetarian: data.flags?.vegetarian,
        spicy: data.flags?.spicy,
        badge: data.flags?.badge,
      },
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    store.products.unshift(newProduct);

    return NextResponse.json(
      {
        success: true,
        product: newProduct,
        message: `Produto "${newProduct.name}" criado com sucesso.`,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao criar produto.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await authenticateServerRequest(request, "admin");
  if (!auth.success) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const parsed = patchProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parâmetros inválidos. É obrigatório fornecer "id" (string) e dados válidos para atualização.',
        },
        { status: 400 }
      );
    }

    const store = getCatalogStore();
    const payload = parsed.data;
    const product = store.products.find((p) => p.id === payload.id);
    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: `Produto com id "${payload.id}" não encontrado.`,
        },
        { status: 404 }
      );
    }

    if (typeof payload.is_active === "boolean") {
      product.is_active = payload.is_active;
    }
    if (payload.name !== undefined) {
      product.name = payload.name.trim();
    }
    if (payload.description !== undefined) {
      product.description = payload.description.trim();
    }
    if (payload.category_id !== undefined) {
      product.category_id = payload.category_id;
    }
    if (payload.images !== undefined) {
      product.images = payload.images;
    }
    if (payload.sizes !== undefined) {
      product.sizes = payload.sizes;
    }
    if (payload.removable_ingredients !== undefined) {
      product.removable_ingredients = payload.removable_ingredients;
    }
    if (payload.flags !== undefined) {
      product.flags = payload.flags;
    }
    product.updated_at = new Date().toISOString();

    return NextResponse.json({
      success: true,
      product,
      message: `Produto "${product.name}" atualizado com sucesso.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao alterar produto.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
