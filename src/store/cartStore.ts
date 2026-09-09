/**
 * Cart Store (Zustand) — Estado Local do Carrinho com Persistência
 * 
 * DIRETRIZES DE ARQUITETURA:
 * 1. O carrinho armazena apenas estado do cliente em localStorage para conveniência.
 * 2. O servidor continua sendo a única autoridade no checkout para validação e recálculo total.
 * 3. Todos os valores de subtotal e itens são expressos em centavos inteiros (cents).
 * 4. Proteção contra hydration mismatch no Next.js com verificação de reidratação.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { OrderItem, HalfAndHalfRule } from "@/types/domain";

export interface CartState {
  items: OrderItem[];
  isOpen: boolean;
  halfAndHalfRule: HalfAndHalfRule;
  _hasHydrated: boolean;

  // Actions
  addItem: (item: OrderItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setHalfAndHalfRule: (rule: HalfAndHalfRule) => void;
  setHasHydrated: (state: boolean) => void;

  // Computed / Selectors
  getSubtotalCents: () => number;
  getTotalItemsCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      halfAndHalfRule: "maior_valor",
      _hasHydrated: false,

      addItem: (newItem) => {
        set((state) => {
          // Verifica se já existe um item exatamente idêntico (mesmo produto, tamanho, sabores, borda, extras, removidos e notas)
          const existingIndex = state.items.findIndex((item) => isSameConfiguration(item, newItem));

          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            const existing = updatedItems[existingIndex]!;
            const newQty = existing.quantity + newItem.quantity;
            updatedItems[existingIndex] = {
              ...existing,
              quantity: newQty,
              total_price_cents: existing.unit_price_cents * newQty,
            };
            return { items: updatedItems, isOpen: true };
          }

          return {
            items: [...state.items, newItem],
            isOpen: true,
          };
        });
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== itemId),
        }));
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) => {
            if (item.id === itemId) {
              return {
                ...item,
                quantity,
                total_price_cents: item.unit_price_cents * quantity,
              };
            }
            return item;
          }),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      setHalfAndHalfRule: (halfAndHalfRule) => set({ halfAndHalfRule }),
      setHasHydrated: (_hasHydrated) => set({ _hasHydrated }),

      getSubtotalCents: () => {
        return get().items.reduce((acc, item) => acc + item.total_price_cents, 0);
      },

      getTotalItemsCount: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },
    }),
    {
      name: "forno-massa-cart-storage",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
      partialize: (state) => ({
        items: state.items,
        halfAndHalfRule: state.halfAndHalfRule,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

/**
 * Compara se dois itens possuem exatamente a mesma configuração personalizada.
 */
function isSameConfiguration(a: OrderItem, b: OrderItem): boolean {
  if (a.product_id !== b.product_id) return false;
  if (a.is_pizza !== b.is_pizza) return false;
  if (a.size?.id !== b.size?.id) return false;
  if (a.crust?.id !== b.crust?.id) return false;
  if ((a.notes || "") !== (b.notes || "")) return false;

  // Compara sabores
  if (a.flavors.length !== b.flavors.length) return false;
  const aFlavors = a.flavors.map((f) => f.product_id).sort().join(",");
  const bFlavors = b.flavors.map((f) => f.product_id).sort().join(",");
  if (aFlavors !== bFlavors) return false;

  // Compara extras
  if (a.extras.length !== b.extras.length) return false;
  const aExtras = a.extras.map((e) => e.id).sort().join(",");
  const bExtras = b.extras.map((e) => e.id).sort().join(",");
  if (aExtras !== bExtras) return false;

  // Compara removidos
  if (a.removed_ingredients.length !== b.removed_ingredients.length) return false;
  const aRem = [...a.removed_ingredients].sort().join(",");
  const bRem = [...b.removed_ingredients].sort().join(",");
  if (aRem !== bRem) return false;

  return true;
}
