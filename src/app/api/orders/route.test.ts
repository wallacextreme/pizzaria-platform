import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST, GET, PATCH } from "./route";

import { globalOrderRepository } from "@/repositories/mockOrderRepository";

vi.mock("@/lib/auth/serverAuth", () => ({
  authenticateServerRequest: vi.fn().mockResolvedValue({
    success: true,
    user: { userId: "mock-staff", role: "staff", isStaff: true, isAdmin: false },
  }),
}));

describe("API Route /api/orders & Anti-Tampering Security Suite", () => {
  beforeEach(() => {
    globalOrderRepository.clear();
  });

  const validDeliveryPayload = {
    customer: {
      name: "Mariana Oliveira",
      phone: "11977776666",
    },
    delivery_type: "delivery",
    address: {
      street: "Avenida Paulista",
      number: "1500",
      neighborhood: "Vila Gastronômica",
      city: "São Paulo",
      state: "SP",
      postal_code: "01311-000",
    },
    items: [
      {
        product_id: "prod-margherita",
        is_pizza: true,
        size_id: "size-grande", // 7200 cents
        flavor_ids: ["prod-margherita"],
        crust_id: "crust-catupiry", // 1200 cents
        extra_ids: ["extra-bacon"], // 800 cents
        quantity: 1,
      },
    ],
    payment_method: "pix",
    fulfillment_channel: "web",
  };

  it("deve criar um pedido delivery com sucesso e calcular taxa de entrega corretamente", async () => {
    const req = new Request("http://localhost:3000/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validDeliveryPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.order).toBeDefined();

    // 7200 (base) + 1200 (borda) + 800 (bacon) = 9200
    expect(json.order.subtotal_cents).toBe(9200);
    // Vila Gastronômica na mockData = 500 cents (R$ 5,00)
    expect(json.order.delivery_fee_cents).toBe(500);
    // Total = 9200 + 500 = 9700 (R$ 97,00)
    expect(json.order.total_cents).toBe(9700);
    expect(json.order.status).toBe("novo");
  });

  it("deve criar pedido de retirada com taxa de entrega zerada", async () => {
    const pickupPayload = {
      ...validDeliveryPayload,
      delivery_type: "retirada",
      address: undefined,
    };

    const req = new Request("http://localhost:3000/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pickupPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.order.delivery_fee_cents).toBe(0);
    expect(json.order.total_cents).toBe(9200);
  });

  it("SEGURANÇA (Anti-Tampering): deve ignorar preço fraudulento enviado pelo cliente e recalcular no servidor", async () => {
    // Cliente malicioso envia declared_total = 100 (R$ 1,00) para uma pizza que custa R$ 92,00
    const tamperedPayload = {
      ...validDeliveryPayload,
      items: [
        {
          ...validDeliveryPayload.items[0],
          client_declared_total_cents: 100, // FRAUDE INTENCIONAL
        },
      ],
    };

    const req = new Request("http://localhost:3000/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tamperedPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.priceTampered).toBe(true);
    // O total do servidor NUNCA é R$ 1,00; ele foi recalculado para R$ 97,00
    expect(json.order.total_cents).toBe(9700);
  });

  it("deve rejeitar pedido em dinheiro se o troco for inferior ao valor total", async () => {
    const invalidCashPayload = {
      ...validDeliveryPayload,
      payment_method: "dinheiro",
      change_for_cents: 5000, // R$ 50,00 quando o total é R$ 97,00
    };

    const req = new Request("http://localhost:3000/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invalidCashPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(422);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toMatch(/Valor para troco inválido/);
  });

  it("deve recuperar pedido por ID ou display_id via GET", async () => {
    // Cria pedido
    const postReq = new Request("http://localhost:3000/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validDeliveryPayload),
    });
    const postRes = await POST(postReq);
    const postJson = await postRes.json();
    const createdId = postJson.order.id;

    // Busca via GET
    const getReq = new Request(`http://localhost:3000/api/orders?id=${createdId}`);
    const getRes = await GET(getReq);
    expect(getRes.status).toBe(200);

    const getJson = await getRes.json();
    expect(getJson.order.id).toBe(createdId);
    expect(getJson.order.customer.name).toBe("Mariana Oliveira");
  });

  it("deve atualizar o status do pedido via PATCH", async () => {
    // 1. Cria pedido inicial com status 'novo'
    const postReq = new Request("http://localhost:3000/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validDeliveryPayload),
    });
    const postRes = await POST(postReq);
    const postJson = await postRes.json();
    const orderId = postJson.order.id;

    // 2. Atualiza para 'em_preparo'
    const patchReq = new Request("http://localhost:3000/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: orderId, status: "em_preparo" }),
    });
    const patchRes = await PATCH(patchReq);
    expect(patchRes.status).toBe(200);

    const patchJson = await patchRes.json();
    expect(patchJson.success).toBe(true);
    expect(patchJson.order.status).toBe("em_preparo");

    // 3. Rejeita status inválido com 400
    const invalidPatchReq = new Request("http://localhost:3000/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: orderId, status: "status_inexistente" }),
    });
    const invalidPatchRes = await PATCH(invalidPatchReq);
    expect(invalidPatchRes.status).toBe(400);
  });
});

