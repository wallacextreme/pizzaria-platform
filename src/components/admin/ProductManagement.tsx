"use client";

import * as React from "react";
import type { Product, StoreManualOverride } from "@/types/domain";
import { formatCurrency } from "@/domain/currency";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ToggleLeft,
  ToggleRight,
  Pizza,
  Store,
  Volume2,
  VolumeX,
  Volume1,
  CheckCircle2,
} from "lucide-react";
import { audioNotifier } from "@/lib/audioNotifier";

interface ProductManagementProps {
  initialProducts: Product[];
  storeStatus: StoreManualOverride;
  onStoreStatusChange: (newStatus: StoreManualOverride) => void;
}

export function ProductManagement({
  initialProducts,
  storeStatus,
  onStoreStatusChange,
}: ProductManagementProps) {
  const [products, setProducts] = React.useState<Product[]>(initialProducts);
  const [audioMuted, setAudioMuted] = React.useState(audioNotifier.getIsMuted());
  const [audioFeedback, setAudioFeedback] = React.useState(false);

  const toggleProductActive = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, is_active: !p.is_active } : p))
    );
  };

  const handleTestAudio = async () => {
    setAudioFeedback(true);
    await audioNotifier.playOrderAlert();
    setTimeout(() => setAudioFeedback(false), 1200);
  };

  const handleToggleMute = () => {
    const muted = audioNotifier.toggleMute();
    setAudioMuted(muted);
  };

  return (
    <div className="space-y-6">
      {/* Controles de Operação da Loja & Áudio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Status Manual de Funcionamento */}
        <div className="p-4 rounded-2xl bg-pizza-charcoal-card border border-pizza-border space-y-3">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-pizza-terracotta" />
            <span className="text-xs font-bold text-pizza-cream">
              Status da Loja (Override Manual)
            </span>
          </div>
          <p className="text-[11px] text-stone-400">
            Controle se o cardápio aceita pedidos imediatamente ou segue a grade horária automática.
          </p>
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {(["auto", "aberto", "fechado"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onStoreStatusChange(mode)}
                className={`px-2 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border ${
                  storeStatus === mode
                    ? mode === "aberto"
                      ? "bg-emerald-950/60 border-emerald-500 text-emerald-400"
                      : mode === "fechado"
                      ? "bg-red-950/60 border-red-500 text-red-400"
                      : "bg-pizza-terracotta/20 border-pizza-terracotta text-pizza-cream"
                    : "border-white/5 bg-black/20 text-stone-400 hover:text-white"
                }`}
              >
                {mode === "auto" ? "Automático" : mode === "aberto" ? "Aberto" : "Fechado"}
              </button>
            ))}
          </div>
        </div>

        {/* Teste e Configuração de Alerta Sonoro */}
        <div className="p-4 rounded-2xl bg-pizza-charcoal-card border border-pizza-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume1 className="w-4 h-4 text-pizza-gold" />
              <span className="text-xs font-bold text-pizza-cream">
                Alerta Sonoro de Cozinha (Web Audio)
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleMute}
              className={`p-1.5 rounded-lg border transition-colors ${
                audioMuted
                  ? "bg-red-950/30 border-red-500/40 text-red-400"
                  : "bg-emerald-950/30 border-emerald-500/40 text-emerald-400"
              }`}
              title={audioMuted ? "Áudio desativado" : "Áudio ativado"}
            >
              {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-stone-400">
            Sintetizador nativo emitindo chime harmônico ao receber novos pedidos no Kanban.
          </p>
          <div className="pt-1">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleTestAudio}
              className="w-full text-xs gap-1.5 h-8 font-bold"
            >
              {audioFeedback ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                  <span className="text-emerald-400">Reproduzindo Chime...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-pizza-gold" />
                  <span>Testar Som da Cozinha</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabela Rápida de Produtos (Pausar / Reativar) */}
      <div className="p-4 rounded-2xl bg-pizza-charcoal-card border border-pizza-border space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Pizza className="w-5 h-5 text-pizza-terracotta" />
            <span className="text-sm font-bold text-pizza-cream">Cardápio & Disponibilidade</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {products.filter((p) => p.is_active).length} ativos / {products.length} total
          </Badge>
        </div>

        <div className="divide-y divide-white/5">
          {products.map((product) => {
            const basePrice = product.sizes[0]?.price_cents || 0;

            return (
              <div
                key={product.id}
                className="py-3 flex items-center justify-between gap-4 transition-colors hover:bg-white/[0.02] px-2 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.images[0] || "/placeholder-pizza.jpg"}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${product.is_active ? "text-pizza-cream" : "text-stone-500 line-through"}`}>
                      {product.name}
                    </p>
                    <p className="text-[11px] text-pizza-gold">
                      A partir de {formatCurrency(basePrice)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={product.is_active ? "success" : "outline"} className="text-[10px]">
                    {product.is_active ? "Disponível" : "Pausado"}
                  </Badge>

                  <button
                    type="button"
                    onClick={() => toggleProductActive(product.id)}
                    className="p-1 rounded text-stone-400 hover:text-white transition-colors"
                    title={product.is_active ? "Pausar item" : "Reativar item"}
                  >
                    {product.is_active ? (
                      <ToggleRight className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-stone-600" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
