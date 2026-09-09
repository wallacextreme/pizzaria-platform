"use client";

import * as React from "react";
import { useCartStore } from "@/store/cartStore";
import { formatCentsToBRL } from "@/domain/currency";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Info,
} from "lucide-react";

export function CartDrawer() {
  const { showToast } = useToast();
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    clearCart,
    getSubtotalCents,
    getTotalItemsCount,
  } = useCartStore();

  const subtotalCents = getSubtotalCents();
  const totalCount = getTotalItemsCount();

  return (
    <Drawer
      isOpen={isOpen}
      onClose={closeCart}
      title="Seu Pedido"
      description={`${totalCount} ${totalCount === 1 ? "item selecionado" : "itens selecionados"}`}
      side="right"
      className="max-w-md w-full"
    >
      <div className="flex flex-col h-full justify-between space-y-6 text-left">
        {/* Lista de Itens ou Estado Vazio */}
        {items.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-pizza-charcoal flex items-center justify-center text-stone-500 border border-pizza-border shadow-inner">
              <ShoppingBag className="w-10 h-10 text-stone-600" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-base text-pizza-cream font-display">
                Seu carrinho está vazio
              </h4>
              <p className="text-xs text-stone-400 max-w-xs mx-auto leading-relaxed">
                Explore nosso cardápio de pizzas artesanais e monte sua combinação favorita.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={closeCart}
              className="mt-2 font-bold"
            >
              Explorar Cardápio
            </Button>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto pr-1 max-h-[calc(100vh-280px)]">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-pizza-charcoal border border-pizza-border space-y-3 relative group"
              >
                {/* Cabeçalho do Item: Nome, Tamanho e Preço */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-pizza-cream text-sm leading-snug">
                      {item.name}
                    </h5>
                    {item.size && (
                      <span className="text-[11px] font-semibold text-pizza-gold block">
                        Tamanho {item.size.name} ({item.size.slices} fatias)
                      </span>
                    )}
                  </div>

                  <span className="font-extrabold text-sm text-pizza-cream whitespace-nowrap">
                    {formatCentsToBRL(item.total_price_cents)}
                  </span>
                </div>

                {/* Detalhamento da Personalização */}
                <div className="space-y-1 text-xs text-stone-400 bg-black/20 p-2.5 rounded-xl border border-white/5">
                  {item.crust && item.crust.price_cents > 0 && (
                    <div className="flex items-center gap-1.5 text-stone-300">
                      <span className="text-[10px] text-pizza-terracotta font-bold">Borda:</span>
                      <span>{item.crust.name}</span>
                    </div>
                  )}

                  {item.extras && item.extras.length > 0 && (
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="text-[10px] text-pizza-gold font-bold">Extras:</span>
                      {item.extras.map((e) => (
                        <span
                          key={e.id}
                          className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] text-stone-300"
                        >
                          +{e.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {item.removed_ingredients && item.removed_ingredients.length > 0 && (
                    <div className="flex flex-wrap gap-1 items-center text-red-400 text-[10px]">
                      <span className="font-bold">Sem:</span>
                      <span>{item.removed_ingredients.join(", ")}</span>
                    </div>
                  )}

                  {item.notes && (
                    <div className="text-[11px] text-stone-400 italic pt-0.5">
                      &ldquo;{item.notes}&rdquo;
                    </div>
                  )}
                </div>

                {/* Controles de Quantidade e Exclusão */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 bg-pizza-charcoal-card p-1 rounded-xl border border-pizza-border">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-stone-300 transition-colors"
                      aria-label="Diminuir quantidade"
                    >
                      {item.quantity === 1 ? (
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      ) : (
                        <Minus className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span className="text-xs font-bold px-2">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-stone-300 transition-colors"
                      aria-label="Aumentar quantidade"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-[11px] text-stone-500 hover:text-red-400 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remover</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resumo Financeiro e Finalização */}
        {items.length > 0 && (
          <div className="pt-4 border-t border-pizza-border space-y-4 shrink-0">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-stone-400">
                <span>Subtotal dos Itens</span>
                <span className="font-bold text-pizza-cream">
                  {formatCentsToBRL(subtotalCents)}
                </span>
              </div>
              <div className="flex items-center justify-between text-stone-500 text-[11px]">
                <span className="flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Taxa de Entrega
                </span>
                <span>Calculada no Checkout</span>
              </div>
              <div className="pt-2 border-t border-pizza-border/60 flex justify-between items-baseline">
                <span className="text-sm font-bold text-pizza-cream">Subtotal</span>
                <span className="text-xl font-black text-pizza-gold">
                  {formatCentsToBRL(subtotalCents)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full font-bold justify-between px-5"
                onClick={() => {
                  showToast(
                    "O fluxo de entrega, CEP e pagamento será habilitado na Fase 3.",
                    "info",
                    "Avançar para Checkout (Fase 3)"
                  );
                }}
              >
                <span>Prosseguir para Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Button>

              <button
                type="button"
                onClick={clearCart}
                className="w-full text-center text-xs text-stone-500 hover:text-stone-300 py-1 transition-colors"
              >
                Esvaziar carrinho
              </button>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
