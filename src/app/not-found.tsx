import * as React from "react";
import Link from "next/link";
import { UtensilsCrossed, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-pizza-charcoal text-pizza-cream flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-pizza-charcoal-card border border-pizza-border rounded-3xl p-8 text-center space-y-6 shadow-2xl">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-pizza-terracotta/10 border border-pizza-terracotta/30 flex items-center justify-center text-pizza-terracotta">
          <span className="text-4xl font-black font-serif">404</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black font-display text-pizza-cream">
            Página Não Encontrada
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
            Parece que a fatia que você estava procurando foi saboreada por outro cliente ou não existe mais.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/">
            <Button
              variant="primary"
              size="lg"
              className="w-full font-bold gap-2 justify-center"
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Voltar ao Cardápio</span>
            </Button>
          </Link>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-pizza-gold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retornar para a página principal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
