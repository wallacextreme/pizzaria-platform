import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { CheckoutModal } from "./CheckoutModal";
import { ToastProvider } from "@/components/ui/Toast";
import { useCartStore } from "@/store/cartStore";
import type { OrderItem } from "@/types/domain";

// Mock do useRouter do Next.js
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("CheckoutModal Component Suite", () => {
  const sampleItem: OrderItem = {
    id: "item-test-1",
    product_id: "prod-margherita",
    name: "Pizza Margherita",
    is_pizza: true,
    size: {
      id: "size-grande",
      name: "Grande",
      price_cents: 7200,
      slices: 8,
      max_flavors: 2,
    },
    flavors: [
      { product_id: "prod-margherita", name: "Margherita", price_cents: 7200 },
    ],
    extras: [],
    removed_ingredients: [],
    unit_price_cents: 7200,
    quantity: 1,
    total_price_cents: 7200,
  };

  beforeEach(() => {
    useCartStore.getState().clearCart();
    useCartStore.getState().addItem(sampleItem);
  });

  it("deve renderizar o modal de checkout com opções de delivery e retirada", () => {
    render(
      <ToastProvider>
        <CheckoutModal isOpen={true} onClose={vi.fn()} />
      </ToastProvider>
    );

    expect(screen.getByText("Finalizar Pedido")).toBeDefined();
    expect(screen.getByText("Delivery em Casa")).toBeDefined();
    expect(screen.getByText("Retirada no Balcão")).toBeDefined();
    expect(screen.getByLabelText(/nome completo/i)).toBeDefined();
    expect(screen.getByLabelText(/whatsapp \/ telefone/i)).toBeDefined();
  });

  it("deve alternar para retirada e exibir endereço da pizzaria com taxa grátis", () => {
    render(
      <ToastProvider>
        <CheckoutModal isOpen={true} onClose={vi.fn()} />
      </ToastProvider>
    );

    const pickupButton = screen.getByRole("button", { name: /retirada no balcão/i });
    fireEvent.click(pickupButton);

    expect(screen.getByText("Retirada no Balcão da Pizzaria")).toBeDefined();
    expect(screen.getByText(/sem taxa de entrega/i)).toBeDefined();
    expect(screen.getByText("Grátis")).toBeDefined();
  });

  it("deve exibir opções de pagamento (PIX, Cartão, Dinheiro)", () => {
    render(
      <ToastProvider>
        <CheckoutModal isOpen={true} onClose={vi.fn()} />
      </ToastProvider>
    );

    expect(screen.getByText("PIX")).toBeDefined();
    expect(screen.getByText("Cartão")).toBeDefined();
    expect(screen.getByText("Dinheiro")).toBeDefined();
  });

  it("deve exibir campo de troco ao selecionar dinheiro e marcar 'Preciso de troco'", () => {
    render(
      <ToastProvider>
        <CheckoutModal isOpen={true} onClose={vi.fn()} />
      </ToastProvider>
    );

    const cashButton = screen.getByRole("button", { name: /dinheiro/i });
    fireEvent.click(cashButton);

    const changeCheckbox = screen.getByLabelText(/preciso de troco/i);
    fireEvent.click(changeCheckbox);

    expect(screen.getByLabelText(/troco para quanto\?/i)).toBeDefined();
  });
});
