"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log do erro operacional
    console.error("Uncaught application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-pizza-charcoal text-pizza-cream flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-pizza-charcoal-card border border-pizza-border rounded-3xl p-8 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black font-display text-pizza-cream">
            Ops! Algo não saiu como esperado
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
            Houve uma instabilidade temporária ao carregar esta página. Não se preocupe, nenhum pedido foi perdido.
          </p>
          {error.digest && (
            <p className="text-[10px] text-stone-500 font-mono pt-1">
              Código de rastreio: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => reset()}
            className="w-full sm:w-auto font-bold gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Tentar Novamente</span>
          </Button>

          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="md"
              className="w-full font-bold gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Voltar ao Início</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
