import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "./cartStore";
import type { OrderItem } from "@/types/domain";

describe("Cart Store Suite (Zustand)", () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  const samplePizzaItem: OrderItem = {
    id: "item-1",
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
      {
        product_id: "prod-margherita",
        name: "Margherita",
        price_cents: 7200,
      },
    ],
    crust: {
      id: "crust-catupiry",
      name: "Borda Catupiry",
      price_cents: 1200,
    },
    extras: [],
    removed_ingredients: ["cebola"],
    notes: "Bem assada",
    unit_price_cents: 8400, // 7200 + 1200
    quantity: 1,
    total_price_cents: 8400,
  };

  const sampleBeverageItem: OrderItem = {
    id: "item-2",
    product_id: "prod-refrigerante",
    name: "Guaraná Antarctica 2L",
    is_pizza: false,
    flavors: [],
    extras: [],
    removed_ingredients: [],
    unit_price_cents: 1400,
    quantity: 2,
    total_price_cents: 2800,
  };

  it("deve inicializar com carrinho vazio", () => {
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(0);
    expect(state.getSubtotalCents()).toBe(0);
    expect(state.getTotalItemsCount()).toBe(0);
  });

  it("deve adicionar um item e atualizar o subtotal e contagem", () => {
    useCartStore.getState().addItem(samplePizzaItem);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.getSubtotalCents()).toBe(8400);
    expect(state.getTotalItemsCount()).toBe(1);
    expect(state.isOpen).toBe(true);
  });

  it("deve somar quantidade quando item com configuração idêntica for adicionado", () => {
    useCartStore.getState().addItem(samplePizzaItem);
    useCartStore.getState().addItem({ ...samplePizzaItem, id: "item-1-dup", quantity: 2 });

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.quantity).toBe(3); // 1 + 2
    expect(state.items[0]?.total_price_cents).toBe(25200); // 8400 * 3
    expect(state.getSubtotalCents()).toBe(25200);
    expect(state.getTotalItemsCount()).toBe(3);
  });

  it("deve criar linha separada quando item possui personalização diferente", () => {
    useCartStore.getState().addItem(samplePizzaItem);

    // Mesmo produto, mas com borda diferente
    const pizzaComBordaCheddar: OrderItem = {
      ...samplePizzaItem,
      id: "item-custom-2",
      crust: {
        id: "crust-cheddar",
        name: "Borda Cheddar",
        price_cents: 1200,
      },
    };

    useCartStore.getState().addItem(pizzaComBordaCheddar);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(2);
    expect(state.getTotalItemsCount()).toBe(2);
    expect(state.getSubtotalCents()).toBe(16800); // 8400 + 8400
  });

  it("deve atualizar a quantidade de um item existente", () => {
    useCartStore.getState().addItem(samplePizzaItem);
    useCartStore.getState().updateQuantity(samplePizzaItem.id, 4);

    const state = useCartStore.getState();
    expect(state.items[0]?.quantity).toBe(4);
    expect(state.items[0]?.total_price_cents).toBe(33600); // 8400 * 4
    expect(state.getSubtotalCents()).toBe(33600);
  });

  it("deve remover o item ao atualizar quantidade para 0 ou negativo", () => {
    useCartStore.getState().addItem(samplePizzaItem);
    useCartStore.getState().updateQuantity(samplePizzaItem.id, 0);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(0);
    expect(state.getSubtotalCents()).toBe(0);
  });

  it("deve remover item explicitamente por removeItem", () => {
    useCartStore.getState().addItem(samplePizzaItem);
    useCartStore.getState().addItem(sampleBeverageItem);

    expect(useCartStore.getState().items).toHaveLength(2);

    useCartStore.getState().removeItem(samplePizzaItem.id);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.id).toBe(sampleBeverageItem.id);
    expect(state.getSubtotalCents()).toBe(2800);
  });

  it("deve limpar todo o carrinho com clearCart", () => {
    useCartStore.getState().addItem(samplePizzaItem);
    useCartStore.getState().addItem(sampleBeverageItem);

    useCartStore.getState().clearCart();

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(0);
    expect(state.getSubtotalCents()).toBe(0);
  });

  it("deve controlar abertura e fechamento do drawer do carrinho", () => {
    useCartStore.getState().closeCart();
    expect(useCartStore.getState().isOpen).toBe(false);

    useCartStore.getState().openCart();
    expect(useCartStore.getState().isOpen).toBe(true);

    useCartStore.getState().toggleCart();
    expect(useCartStore.getState().isOpen).toBe(false);
  });
});
