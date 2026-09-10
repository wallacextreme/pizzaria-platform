import * as React from "react";
import { Flame } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="min-h-screen bg-pizza-charcoal text-pizza-cream flex flex-col items-center justify-center p-6 space-y-4"
    >
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-pizza-charcoal-card border border-pizza-border flex items-center justify-center shadow-xl animate-pulse">
          <Flame className="w-8 h-8 text-pizza-terracotta animate-bounce" />
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className="text-base font-bold font-display text-pizza-cream">
          Aquecendo o forno...
        </p>
        <p className="text-xs text-stone-400">
          Carregando as melhores opções artesanais para você.
        </p>
      </div>

      <span className="sr-only">Carregando conteúdo da página...</span>
    </div>
  );
}
