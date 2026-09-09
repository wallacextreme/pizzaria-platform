import * as React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { render, screen, fireEvent } from "@testing-library/react";
import { useAdminAuthStore } from "@/store/adminAuthStore";
import { OrderCard } from "./OrderCard";
import { MetricsCards } from "./MetricsCards";
import { KanbanBoard } from "./KanbanBoard";
import type { Order } from "@/types/domain";

const MOCK_ORDER: Order = {
  id: "ord-test-1",
  display_id: "#PZ-9999",
  status: "novo",
  customer: { name: "Carlos Eduardo", phone: "(11) 98888-7777" },
  delivery_type: "delivery",
  address: {
    street: "Rua das Flores",
    number: "100",
    neighborhood: "Centro",
    city: "São Paulo",
    state: "SP",
    postal_code: "01001-000",
  },
  items: [
    {
      id: "it-1",
      product_id: "p-1",
      name: "Pizza Calabresa",
      is_pizza: true,
      flavors: [{ product_id: "p-1", name: "Calabresa", price_cents: 6000 }],
      extras: [],
      removed_ingredients: ["cebola"],
      unit_price_cents: 6000,
      quantity: 1,
      total_price_cents: 6000,
    },
  ],
  payment_method: "pix",
  delivery_fee_cents: 700,
  subtotal_cents: 6000,
  total_cents: 6700,
  fulfillment_channel: "web",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe("Admin & Kitchen Kanban Test Suite", () => {
  describe("useAdminAuthStore", () => {
    beforeEach(() => {
      useAdminAuthStore.getState().logout();
    });

    it("inicia desautenticado por padrão", () => {
      const state = useAdminAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });

    it("autentica como admin e define papel e nome corretamente", () => {
      useAdminAuthStore.getState().login("admin@pizzaria.com", "admin", "Gerente Geral");
      const state = useAdminAuthStore.getState();

      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe("admin@pizzaria.com");
      expect(state.user?.role).toBe("admin");
      expect(state.user?.name).toBe("Gerente Geral");
    });

    it("desautentica ao chamar logout", () => {
      useAdminAuthStore.getState().login("staff@pizzaria.com", "staff");
      expect(useAdminAuthStore.getState().isAuthenticated).toBe(true);

      useAdminAuthStore.getState().logout();
      expect(useAdminAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAdminAuthStore.getState().user).toBeNull();
    });
  });

  describe("OrderCard Component", () => {
    it("renderiza identificador, cliente, valor e ingrediente removido em destaque", () => {
      const onStatusChange = vi.fn();
      render(<OrderCard order={MOCK_ORDER} onStatusChange={onStatusChange} />);

      expect(screen.getByText("#PZ-9999")).toBeDefined();
      expect(screen.getByText("Carlos Eduardo")).toBeDefined();
      expect(screen.getByText("SEM CEBOLA")).toBeDefined();
      expect(screen.getByText("Iniciar Preparo")).toBeDefined();
    });

    it("aciona callback de transição de status ao clicar no botão de avanço", () => {
      const onStatusChange = vi.fn();
      render(<OrderCard order={MOCK_ORDER} onStatusChange={onStatusChange} />);

      const advanceBtn = screen.getByText("Iniciar Preparo");
      fireEvent.click(advanceBtn);

      expect(onStatusChange).toHaveBeenCalledWith("ord-test-1", "em_preparo");
    });
  });

  describe("MetricsCards Component", () => {
    it("calcula faturamento, pedidos e itens em cozinha com precisão a partir de centavos", () => {
      const orders: Order[] = [
        MOCK_ORDER, // total_cents: 6700, status: novo (em cozinha)
        {
          ...MOCK_ORDER,
          id: "ord-test-2",
          total_cents: 8000,
          status: "concluido",
        },
      ];

      render(<MetricsCards orders={orders} />);

      // Faturamento total: 6700 + 8000 = 14700 cents = R$ 147,00
      expect(screen.getByText("R$ 147,00")).toBeDefined();
      // Total de pedidos: 2
      expect(screen.getByText("2")).toBeDefined();
      // Em cozinha (apenas 'novo'): 1
      expect(screen.getByText("1")).toBeDefined();
      // Ticket médio: 14700 / 2 = 7350 cents = R$ 73,50
      expect(screen.getByText("R$ 73,50")).toBeDefined();
    });
  });

  describe("KanbanBoard Component", () => {
    it("renderiza as colunas e aloca os pedidos de acordo com o status", () => {
      const orders: Order[] = [
        MOCK_ORDER, // status: novo
        {
          ...MOCK_ORDER,
          id: "ord-test-3",
          display_id: "#PZ-3333",
          status: "em_preparo",
        },
      ];

      const onStatusChange = vi.fn().mockResolvedValue(undefined);
      const onRefresh = vi.fn();

      render(
        <KanbanBoard
          orders={orders}
          onStatusChange={onStatusChange}
          onRefresh={onRefresh}
        />
      );

      expect(screen.getByText("Novos Pedidos")).toBeDefined();
      expect(screen.getByText("Em Preparo")).toBeDefined();
      expect(screen.getByText("No Forno")).toBeDefined();
      expect(screen.getByText("A Caminho / Despachado")).toBeDefined();
      expect(screen.getByText("Concluídos")).toBeDefined();

      expect(screen.getByText("#PZ-9999")).toBeDefined();
      expect(screen.getByText("#PZ-3333")).toBeDefined();
    });
  });
});
