import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { PizzaBuilderModal } from "./PizzaBuilderModal";
import { ToastProvider } from "@/components/ui/Toast";
import { MOCK_PRODUCTS } from "@/lib/mockData";
import { useCartStore } from "@/store/cartStore";

describe("PizzaBuilderModal Component Suite", () => {
  const margherita = MOCK_PRODUCTS[0]!;
  const allPizzas = MOCK_PRODUCTS.filter((p) => p.flags.is_pizza);

  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it("deve renderizar o modal com os tamanhos disponíveis", () => {
    render(
      <ToastProvider>
        <PizzaBuilderModal
          isOpen={true}
          onClose={vi.fn()}
          initialProduct={margherita}
          allPizzas={allPizzas}
        />
      </ToastProvider>
    );

    expect(screen.getByText("Personalize sua Pizza Artesanal")).toBeDefined();
    expect(screen.getByText("Brotinho")).toBeDefined();
    expect(screen.getByText("Média")).toBeDefined();
    expect(screen.getByText("Grande")).toBeDefined();
    expect(screen.getByText("Família")).toBeDefined();
  });

  it("deve adicionar o item ao carrinho ao clicar no botão Adicionar ao Pedido", () => {
    const handleClose = vi.fn();

    render(
      <ToastProvider>
        <PizzaBuilderModal
          isOpen={true}
          onClose={handleClose}
          initialProduct={margherita}
          allPizzas={allPizzas}
        />
      </ToastProvider>
    );

    const addButton = screen.getByRole("button", { name: /adicionar ao pedido/i });
    fireEvent.click(addButton);

    // O carrinho deve conter o item adicionado
    const cartItems = useCartStore.getState().items;
    expect(cartItems).toHaveLength(1);
    expect(cartItems[0]?.product_id).toBe(margherita.id);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
