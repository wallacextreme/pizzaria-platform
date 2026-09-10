import { describe, it, expect } from "vitest";
import { calculateDailyMetrics, isSameCivilDay } from "./metrics";
import type { Order } from "@/types/domain";

const BASE_ORDER: Order = {
  id: "ord-1",
  display_id: "#PZ-1001",
  status: "novo",
  customer: { name: "Cliente Teste", phone: "(11) 99999-9999" },
  delivery_type: "delivery",
  items: [],
  payment_method: "pix",
  delivery_fee_cents: 500,
  subtotal_cents: 5000,
  total_cents: 5500,
  fulfillment_channel: "web",
  created_at: "2026-09-10T12:00:00.000Z",
  updated_at: "2026-09-10T12:00:00.000Z",
};

describe("Dashboard Metrics Domain Logic", () => {
  it("retorna zeros quando a lista de pedidos estiver vazia", () => {
    const metrics = calculateDailyMetrics([]);
    expect(metrics.revenueOfDayCents).toBe(0);
    expect(metrics.ordersOfDayCount).toBe(0);
    expect(metrics.inProgressCount).toBe(0);
    expect(metrics.averageTicketCents).toBe(0);
    expect(metrics.cancelledCount).toBe(0);
  });

  it("calcula faturamento, pedidos e ticket médio excluindo pedidos cancelados", () => {
    const orders: Order[] = [
      { ...BASE_ORDER, id: "ord-1", total_cents: 6000, status: "novo" },
      { ...BASE_ORDER, id: "ord-2", total_cents: 8000, status: "em_preparo" },
      { ...BASE_ORDER, id: "ord-3", total_cents: 10000, status: "concluido" },
      { ...BASE_ORDER, id: "ord-4", total_cents: 12000, status: "cancelado" }, // Deve ser excluído
    ];

    const metrics = calculateDailyMetrics(orders);

    // Faturamento: 6000 + 8000 + 10000 = 24000
    expect(metrics.revenueOfDayCents).toBe(24000);
    // Pedidos válidos: 3
    expect(metrics.ordersOfDayCount).toBe(3);
    // Em andamento: 'novo' e 'em_preparo' = 2
    expect(metrics.inProgressCount).toBe(2);
    // Ticket médio: 24000 / 3 = 8000
    expect(metrics.averageTicketCents).toBe(8000);
    // Cancelados: 1
    expect(metrics.cancelledCount).toBe(1);
    expect(metrics.totalReceivedCount).toBe(4);
  });

  it("computa pedidos em andamento contemplando ['novo', 'em_preparo', 'no_forno', 'saiu_para_entrega']", () => {
    const orders: Order[] = [
      { ...BASE_ORDER, id: "ord-1", status: "novo" },
      { ...BASE_ORDER, id: "ord-2", status: "em_preparo" },
      { ...BASE_ORDER, id: "ord-3", status: "no_forno" },
      { ...BASE_ORDER, id: "ord-4", status: "saiu_para_entrega" },
      { ...BASE_ORDER, id: "ord-5", status: "concluido" },
      { ...BASE_ORDER, id: "ord-6", status: "cancelado" },
    ];

    const metrics = calculateDailyMetrics(orders);
    expect(metrics.inProgressCount).toBe(4);
  });

  it("arredonda ticket médio de forma estrita para centavos inteiros", () => {
    const orders: Order[] = [
      { ...BASE_ORDER, id: "ord-1", total_cents: 1000, status: "concluido" },
      { ...BASE_ORDER, id: "ord-2", total_cents: 2000, status: "concluido" },
      { ...BASE_ORDER, id: "ord-3", total_cents: 2000, status: "concluido" },
    ];

    // Faturamento: 5000 / 3 = 1666.666... -> arredonda para 1667
    const metrics = calculateDailyMetrics(orders);
    expect(metrics.averageTicketCents).toBe(1667);
  });

  it("filtra corretamente por data civil quando filterByDay é ativado", () => {
    const refDate = new Date("2026-09-10T15:00:00.000Z");
    const orders: Order[] = [
      {
        ...BASE_ORDER,
        id: "ord-today-1",
        total_cents: 5000,
        status: "concluido",
        created_at: "2026-09-10T10:00:00.000Z",
      },
      {
        ...BASE_ORDER,
        id: "ord-today-2",
        total_cents: 7000,
        status: "novo",
        created_at: "2026-09-10T14:30:00.000Z",
      },
      {
        ...BASE_ORDER,
        id: "ord-yesterday",
        total_cents: 9000,
        status: "concluido",
        created_at: "2026-09-09T20:00:00.000Z",
      },
    ];

    const metrics = calculateDailyMetrics(orders, { referenceDate: refDate, filterByDay: true });

    // Apenas os 2 de hoje entram no faturamento
    expect(metrics.ordersOfDayCount).toBe(2);
    expect(metrics.revenueOfDayCents).toBe(12000);
    expect(metrics.averageTicketCents).toBe(6000);
  });

  it("identifica corretamente a mesma data civil via isSameCivilDay", () => {
    const d1 = new Date(2026, 8, 10, 8, 0);
    const d2 = new Date(2026, 8, 10, 23, 59);
    const d3 = new Date(2026, 8, 11, 0, 1);

    expect(isSameCivilDay(d1, d2)).toBe(true);
    expect(isSameCivilDay(d1, d3)).toBe(false);
  });
});
