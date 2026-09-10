"use client";

import * as React from "react";
import Link from "next/link";
import { Home, UtensilsCrossed, ShoppingBag, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activeTab?: "inicio" | "cardapio" | "carrinho" | "horarios";
  cartItemCount?: number;
  onOpenCart?: () => void;
  onOpenHours?: () => void;
}

export function BottomNav({
  activeTab = "inicio",
  cartItemCount = 0,
  onOpenCart,
  onOpenHours,
}: BottomNavProps) {
  return (
    <nav
      aria-label="Navegação móvel"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-pizza-charcoal/95 backdrop-blur-lg border-t border-pizza-border px-3 py-2 pb-safe"
    >
      <div className="grid grid-cols-4 gap-1 items-center max-w-md mx-auto">
        {/* Início */}
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center justify-center min-h-[48px] py-1 rounded-xl text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pizza-terracotta",
            activeTab === "inicio"
              ? "text-pizza-terracotta font-bold"
              : "text-stone-400 hover:text-stone-200"
          )}
          aria-label="Ir para página inicial"
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Início</span>
        </Link>

        {/* Cardápio */}
        <a
          href="#cardapio"
          className={cn(
            "flex flex-col items-center justify-center min-h-[48px] py-1 rounded-xl text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pizza-terracotta",
            activeTab === "cardapio"
              ? "text-pizza-terracotta font-bold"
              : "text-stone-400 hover:text-stone-200"
          )}
          aria-label="Ver cardápio de pizzas"
        >
          <UtensilsCrossed className="w-5 h-5 mb-0.5" />
          <span>Cardápio</span>
        </a>

        {/* Carrinho */}
        <button
          type="button"
          onClick={onOpenCart}
          className="relative flex flex-col items-center justify-center min-h-[48px] py-1 rounded-xl text-[10px] font-medium text-stone-400 hover:text-stone-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pizza-terracotta"
          aria-label={`Carrinho com ${cartItemCount} itens`}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 mb-0.5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-pizza-terracotta text-white text-[9px] font-black flex items-center justify-center shadow-md">
                {cartItemCount}
              </span>
            )}
          </div>
          <span>Carrinho</span>
        </button>

        {/* Horários */}
        <button
          type="button"
          onClick={onOpenHours}
          className="flex flex-col items-center justify-center min-h-[48px] py-1 rounded-xl text-[10px] font-medium text-stone-400 hover:text-stone-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pizza-terracotta"
          aria-label="Ver horários de funcionamento"
        >
          <Clock className="w-5 h-5 mb-0.5" />
          <span>Horários</span>
        </button>
      </div>
    </nav>
  );
}
