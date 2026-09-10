import { describe, it, expect } from "vitest";
import { reconcileOrders } from "./orderReconciliation";
import type { Order } from "@/types/domain";

const ORDER_A: Order = {
  id: "ord-a",
  display_id: "#PZ-1001",
  status: "novo",
  customer: { name: "Cliente A", phone: "(11) 91111-1111" },
  delivery_type: "delivery",
  items: [],
  payment_method: "pix",
  delivery_fee_cents: 500,
  subtotal_cents: 5000,
  total_cents: 5500,
  fulfillment_channel: "web",
  created_at: "2026-09-10T10:00:00.000Z",
  updated_at: "2026-09-10T10:00:00.000Z",
};

const ORDER_B: Order = {
  id: "ord-b",
  display_id: "#PZ-1002",
  status: "em_preparo",
  customer: { name: "Cliente B", phone: "(11) 92222-2222" },
  delivery_type: "retirada",
  items: [],
  payment_method: "cartao",
  delivery_fee_cents: 0,
  subtotal_cents: 6000,
  total_cents: 6000,
  fulfillment_channel: "web",
  created_at: "2026-09-10T10:05:00.000Z",
  updated_at: "2026-09-10T10:05:00.000Z",
};

describe("orderReconciliation Domain Logic", () => {
  it("adiciona um novo pedido recebido via Realtime INSERT sem duplicar", () => {
    const current = [ORDER_A];
    const incoming = ORDER_B;

    const result = reconcileOrders(current, incoming);

    expect(result.orders.length).toBe(2);
    expect(result.orders.map((o) => o.id)).toContain("ord-a");
    expect(result.orders.map((o) => o.id)).toContain("ord-b");
    expect(result.hasNewIncomingOrder).toBe(false); // ORDER_B tem status 'em_preparo'
  });

  it("sinaliza hasNewIncomingOrder = true quando chega novo pedido com status 'novo'", () => {
    const current = [ORDER_B];
    const incomingNew: Order = {
      ...ORDER_A,
      id: "ord-c",
      status: "novo",
      created_at: "2026-09-10T10:10:00.000Z",
      updated_at: "2026-09-10T10:10:00.000Z",
    };

    const result = reconcileOrders(current, incomingNew);
    expect(result.hasNewIncomingOrder).toBe(true);
    expect(result.orders[0]?.id).toBe("ord-c"); // Mais recente no topo
  });

  it("atualiza pedido existente quando payload possui updated_at mais recente", () => {
    const current = [ORDER_A];
    const updatedA: Order = {
      ...ORDER_A,
      status: "em_preparo",
      updated_at: "2026-09-10T10:15:00.000Z",
    };

    const result = reconcileOrders(current, updatedA);

    expect(result.orders.length).toBe(1);
    expect(result.orders[0]?.status).toBe("em_preparo");
    expect(result.updatedOrderIds).toContain("ord-a");
  });

  it("PROTEÇÃO CONTRA RACE CONDITION: descarta atualização obsoleta de polling que chega com timestamp anterior", () => {
    // O estado atual já recebeu Realtime e avançou para 'no_forno' às 10:20
    const currentLatest: Order = {
      ...ORDER_A,
      status: "no_forno",
      updated_at: "2026-09-10T10:20:00.000Z",
    };

    // Um polling de 10s atrasado chega depois trazendo o pedido ainda em 'em_preparo' das 10:10
    const stalePolledOrder: Order = {
      ...ORDER_A,
      status: "em_preparo",
      updated_at: "2026-09-10T10:10:00.000Z",
    };

    const result = reconcileOrders([currentLatest], stalePolledOrder);

    // O status mais recente ('no_forno') DEVE ser mantido intacto
    expect(result.orders.length).toBe(1);
    expect(result.orders[0]?.status).toBe("no_forno");
    expect(result.orders[0]?.updated_at).toBe("2026-09-10T10:20:00.000Z");
  });

  it("é estritamente idempotente quando eventos repetidos são recebidos", () => {
    const current = [ORDER_A, ORDER_B];

    // Reenvio do mesmo evento duplicado
    const result1 = reconcileOrders(current, ORDER_A);
    const result2 = reconcileOrders(result1.orders, ORDER_A);

    expect(result2.orders.length).toBe(2);
    expect(result2.orders[0]?.id).toBe(ORDER_B.id); // 10:05 > 10:00
    expect(result2.orders[1]?.id).toBe(ORDER_A.id);
  });

  it("reconcilia lista completa de resync de polling sem perder novos pedidos da memória", () => {
    const memOrder: Order = {
      ...ORDER_A,
      id: "ord-in-flight",
      created_at: "2026-09-10T10:30:00.000Z",
      updated_at: "2026-09-10T10:30:00.000Z",
    };
    const current = [memOrder, ORDER_A];

    // Resync do servidor traz ORDER_A e ORDER_B
    const polledBatch = [ORDER_A, ORDER_B];

    const result = reconcileOrders(current, polledBatch);

    expect(result.orders.length).toBe(3);
    expect(result.orders.map((o) => o.id)).toEqual(["ord-in-flight", "ord-b", "ord-a"]);
  });
});
