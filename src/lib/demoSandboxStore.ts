import { validateAndRecalculateOrder } from "@/domain/orderValidator";
import { validateStatusTransition } from "@/domain/orderTransitions";
import {
  MOCK_DELIVERY_ZONES,
  MOCK_PRODUCTS,
  MOCK_STORE_SETTINGS,
} from "@/lib/mockData";
import { publishRealtimeSync } from "@/lib/realtimeBroadcast";
import type { Order, OrderStatus } from "@/types/domain";

const STORAGE_KEY = "pizzaria-forno-massa-demo-orders-v1";

function createInitialSeedOrders(): Order[] {
  const now = Date.now();
  return [
    {
      id: "demo-ord-1041",
      display_id: "#PZ-1041",
      customer: {
        name: "Ana Beatriz Ribeiro",
        phone: "(11) 98765-4321",
      },
      delivery_type: "delivery",
      address: {
        street: "Rua das Oliveiras",
        number: "245",
        neighborhood: "Vila Gastronômica",
        city: "São Paulo",
        state: "SP",
        postal_code: "01310100",
        complement: "Apto 42",
      },
      items: [
        {
          id: "demo-item-1",
          product_id: "prod-1",
          name: "1/2 Margherita Clássica + 1/2 Calabresa Artesanal",
          is_pizza: true,
          size: { id: "grande", name: "Grande", slices: 8, price_cents: 6500, max_flavors: 2 },
          flavors: [
            { product_id: "prod-1", name: "Margherita Clássica", price_cents: 6500 },
            { product_id: "prod-2", name: "Calabresa Artesanal Defumada", price_cents: 6800 },
          ],
          extras: [],
          removed_ingredients: [],
          quantity: 1,
          unit_price_cents: 6800,
          total_price_cents: 6800,
        },
        {
          id: "demo-item-2",
          product_id: "prod-7",
          name: "Coca-Cola Gelada 2L",
          is_pizza: false,
          flavors: [{ product_id: "prod-7", name: "Coca-Cola Gelada 2L", price_cents: 1600 }],
          extras: [],
          removed_ingredients: [],
          quantity: 1,
          unit_price_cents: 1600,
          total_price_cents: 1600,
        },
      ],
      subtotal_cents: 8400,
      delivery_fee_cents: 800,
      total_cents: 9200,
      payment_method: "pix",
      status: "novo",
      fulfillment_channel: "web",
      created_at: new Date(now - 4 * 60_000).toISOString(),
      updated_at: new Date(now - 4 * 60_000).toISOString(),
    },
    {
      id: "demo-ord-1042",
      display_id: "#PZ-1042",
      customer: {
        name: "Lucas Mendonça",
        phone: "(11) 97123-8890",
      },
      delivery_type: "delivery",
      address: {
        street: "Av. Central",
        number: "880",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        postal_code: "01001000",
      },
      items: [
        {
          id: "demo-item-3",
          product_id: "prod-3",
          name: "Quatro Queijos Nobres",
          is_pizza: true,
          size: { id: "familia", name: "Família", slices: 12, price_cents: 9500, max_flavors: 2 },
          flavors: [{ product_id: "prod-3", name: "Quatro Queijos Nobres", price_cents: 9500 }],
          crust: { id: "catupiry", name: "Borda Recheada Catupiry Original", price_cents: 1400 },
          extras: [],
          removed_ingredients: [],
          quantity: 1,
          unit_price_cents: 10900,
          total_price_cents: 10900,
        },
      ],
      subtotal_cents: 10900,
      delivery_fee_cents: 600,
      total_cents: 11500,
      payment_method: "cartao",
      status: "em_preparo",
      fulfillment_channel: "web",
      created_at: new Date(now - 11 * 60_000).toISOString(),
      updated_at: new Date(now - 7 * 60_000).toISOString(),
    },
    {
      id: "demo-ord-1043",
      display_id: "#PZ-1043",
      customer: {
        name: "Fernanda Costa",
        phone: "(11) 96444-2211",
      },
      delivery_type: "retirada",
      items: [
        {
          id: "demo-item-4",
          product_id: "prod-5",
          name: "Parma & Rúcula Selvagem",
          is_pizza: true,
          size: { id: "grande", name: "Grande", slices: 8, price_cents: 8200, max_flavors: 2 },
          flavors: [{ product_id: "prod-5", name: "Parma & Rúcula Selvagem", price_cents: 8200 }],
          extras: [],
          removed_ingredients: [],
          quantity: 1,
          unit_price_cents: 8200,
          total_price_cents: 8200,
        },
      ],
      subtotal_cents: 8200,
      delivery_fee_cents: 0,
      total_cents: 8200,
      payment_method: "dinheiro",
      change_for_cents: 10000,
      status: "no_forno",
      fulfillment_channel: "whatsapp",
      created_at: new Date(now - 18 * 60_000).toISOString(),
      updated_at: new Date(now - 3 * 60_000).toISOString(),
    },
  ];
}

function readOrdersFromStorage(): Order[] {
  if (typeof window === "undefined") return createInitialSeedOrders();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = createInitialSeedOrders();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Fallback em caso de storage bloqueado
  }
  return createInitialSeedOrders();
}

function writeOrdersToStorage(orders: Order[], affectedOrderId?: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    publishRealtimeSync("orders", affectedOrderId);
  } catch {
    // Falha silenciosa se quota excedida
  }
}

export function listDemoOrders(): Order[] {
  return readOrdersFromStorage();
}

export function getDemoOrderById(id: string): Order | null {
  return readOrdersFromStorage().find((o) => o.id === id) || null;
}

export function createDemoOrder(payload: unknown): { order: Order; priceTampered: boolean } {
  const { order, priceTampered } = validateAndRecalculateOrder(payload, {
    products: MOCK_PRODUCTS,
    deliveryZones: MOCK_DELIVERY_ZONES,
    settings: MOCK_STORE_SETTINGS,
  });

  const existing = readOrdersFromStorage();
  const next = [order, ...existing];
  writeOrdersToStorage(next, order.id);
  return { order, priceTampered };
}

export function transitionDemoOrderStatus(orderId: string, newStatus: OrderStatus): Order {
  const orders = readOrdersFromStorage();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) {
    throw new Error("Pedido não encontrado no sandbox de demonstração.");
  }

  const current = orders[idx];
  const transition = validateStatusTransition(current.status, newStatus);
  if (!transition.isValid) {
    throw new Error(transition.error || "Transição de status inválida.");
  }

  const updated: Order = {
    ...current,
    status: newStatus,
    updated_at: new Date().toISOString(),
  };
  const next = [...orders];
  next[idx] = updated;
  writeOrdersToStorage(next, orderId);
  return updated;
}

export function simulateRandomDemoOrder(): Order {
  const customers = [
    { name: "Rafael Nogueira", phone: "(11) 99123-4567" },
    { name: "Mariana Alencar", phone: "(11) 98456-7890" },
    { name: "Gabriel Fonseca", phone: "(11) 97789-1234" },
  ];
  const cust = customers[Math.floor(Math.random() * customers.length)];
  const pizzas = MOCK_PRODUCTS.filter((p) => p.flags.is_pizza && p.is_active);
  const pizza = pizzas[Math.floor(Math.random() * pizzas.length)] || MOCK_PRODUCTS[0];
  const size = pizza.sizes[1] || pizza.sizes[0];
  const zone = MOCK_DELIVERY_ZONES[Math.floor(Math.random() * MOCK_DELIVERY_ZONES.length)];

  const { order } = createDemoOrder({
    customer: cust,
    delivery_type: "delivery",
    address: {
      street: "Rua Monte Castelo",
      number: String(Math.floor(Math.random() * 500) + 10),
      neighborhood: zone?.neighborhood || "Centro",
      city: "São Paulo",
      state: "SP",
      postal_code: "01310100",
    },
    items: [
      {
        product_id: pizza.id,
        is_pizza: true,
        size_id: size?.id || "grande",
        flavor_ids: [pizza.id],
        extra_ids: [],
        removed_ingredients: [],
        quantity: 1,
        client_declared_total_cents: size?.price_cents || 6500,
      },
    ],
    payment_method: "pix",
    fulfillment_channel: "web",
  });

  return order;
}

export function resetDemoSandbox(): Order[] {
  const fresh = createInitialSeedOrders();
  writeOrdersToStorage(fresh);
  return fresh;
}
