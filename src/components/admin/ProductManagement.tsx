"use client";

import * as React from "react";
import type { Product, StoreManualOverride } from "@/types/domain";
import { formatCurrency } from "@/domain/currency";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAdminAuthStore } from "@/store/adminAuthStore";
import {
  ToggleLeft,
  ToggleRight,
  Pizza,
  Store,
  Volume2,
  VolumeX,
  Volume1,
  CheckCircle2,
  Loader2,
  AlertCircle,
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
  const { user } = useAdminAuthStore();
  const isAdmin = user?.role === "admin";

  const [products, setProducts] = React.useState<Product[]>(initialProducts);
  const [audioMuted, setAudioMuted] = React.useState(audioNotifier.getIsMuted());
  const [audioVolume, setAudioVolume] = React.useState(Math.round(audioNotifier.getVolume() * 100));
  const [audioFeedback, setAudioFeedback] = React.useState(false);
  const [isUpdatingProduct, setIsUpdatingProduct] = React.useState<string | null>(null);
  const [isUpdatingStore, setIsUpdatingStore] = React.useState(false);
  const [feedbackMessage, setFeedbackMessage] = React.useState<{ text: string; isError?: boolean } | null>(null);

  // Exibe feedback temporário
  const showFeedback = (text: string, isError = false) => {
    setFeedbackMessage({ text, isError });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Pausar / Reativar Produto com Persistência no Backend
  const handleToggleProduct = async (productId: string, currentActive: boolean) => {
    if (!isAdmin) {
      showFeedback("Apenas administradores podem pausar ou reativar produtos.", true);
      return;
    }

    const nextActive = !currentActive;
    setIsUpdatingProduct(productId);

    try {
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, is_active: nextActive }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, is_active: nextActive } : p))
        );
        showFeedback(data.message || `Produto ${nextActive ? "reativado" : "pausado"} com sucesso!`);
      } else {
        showFeedback(data.error || "Erro ao atualizar produto no servidor.", true);
      }
    } catch {
      showFeedback("Erro de conexão ao atualizar produto.", true);
    } finally {
      setIsUpdatingProduct(null);
    }
  };

  // Alterar Status Operacional da Loja com Persistência no Backend
  const handleStoreStatusChange = async (newOverride: StoreManualOverride) => {
    if (!isAdmin) {
      showFeedback("Apenas administradores podem alterar o funcionamento manual da loja.", true);
      return;
    }

    if (newOverride === storeStatus) return;

    setIsUpdatingStore(true);
    try {
      const res = await fetch("/api/store/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manual_override: newOverride }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onStoreStatusChange(newOverride);
        showFeedback(`Funcionamento da loja alterado para "${newOverride}".`);
      } else {
        showFeedback(data.error || "Falha ao persistir status da loja.", true);
      }
    } catch {
      showFeedback("Erro de conexão ao alterar status da loja.", true);
    } finally {
      setIsUpdatingStore(false);
    }
  };

  // Áudio: Teste, Volume e Mute
  const handleTestAudio = async () => {
    setAudioFeedback(true);
    await audioNotifier.unlockAudioContext();
    const success = await audioNotifier.playOrderAlert();
    if (!success && !audioMuted) {
      showFeedback("Áudio bloqueado pelo navegador. Clique na tela para desbloquear.", true);
    }
    setTimeout(() => setAudioFeedback(false), 1200);
  };

  const handleToggleMute = () => {
    const muted = audioNotifier.toggleMute();
    setAudioMuted(muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseInt(e.target.value, 10);
    setAudioVolume(vol);
    audioNotifier.setVolume(vol / 100);
  };

  return (
    <div className="space-y-6">
      {/* Feedback Toast Inline */}
      {feedbackMessage && (
        <div
          role="status"
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 transition-all ${
            feedbackMessage.isError
              ? "bg-red-950/50 border-red-500/50 text-red-300"
              : "bg-emerald-950/50 border-emerald-500/50 text-emerald-300"
          }`}
        >
          {feedbackMessage.isError ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Controles de Operação da Loja & Áudio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Manual de Funcionamento */}
        <div className="p-4 rounded-2xl bg-pizza-charcoal-card border border-pizza-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-pizza-terracotta" />
              <span className="text-xs font-bold text-pizza-cream">
                Status da Loja (Override Manual)
              </span>
            </div>
            {isUpdatingStore && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-pizza-gold" />
            )}
          </div>
          <p className="text-[11px] text-stone-400">
            Define se o cardápio aceita pedidos imediatamente ou segue a grade horária automática configurada.
          </p>
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {(["auto", "aberto", "fechado"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                disabled={isUpdatingStore || !isAdmin}
                onClick={() => handleStoreStatusChange(mode)}
                className={`px-2 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border ${
                  storeStatus === mode
                    ? mode === "aberto"
                      ? "bg-emerald-950/60 border-emerald-500 text-emerald-400"
                      : mode === "fechado"
                      ? "bg-red-950/60 border-red-500 text-red-400"
                      : "bg-pizza-terracotta/20 border-pizza-terracotta text-pizza-cream"
                    : "border-white/5 bg-black/20 text-stone-400 hover:text-white"
                } ${!isAdmin ? "opacity-50 cursor-not-allowed" : ""}`}
                title={!isAdmin ? "Apenas administradores podem alterar" : ""}
              >
                {mode === "auto" ? "Automático" : mode === "aberto" ? "Aberto" : "Fechado"}
              </button>
            ))}
          </div>
          {!isAdmin && (
            <p className="text-[10px] text-amber-400/80 italic">
              * Apenas administradores podem modificar o funcionamento da loja.
            </p>
          )}
        </div>

        {/* Configurações e Teste de Alerta Sonoro */}
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

          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-stone-400">
              <span>Volume do Alerta</span>
              <span className="font-bold text-pizza-gold">{audioVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={audioVolume}
              onChange={handleVolumeChange}
              className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-pizza-gold"
              aria-label="Controle de volume do alarme da cozinha"
            />
          </div>

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
                  <span>Testar Alerta Sonoro</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabela de Produtos (Pausar / Reativar com Persistência) */}
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
            const isPending = isUpdatingProduct === product.id;

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

                  {isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin text-pizza-terracotta" />
                  ) : (
                    <button
                      type="button"
                      disabled={!isAdmin}
                      onClick={() => handleToggleProduct(product.id, product.is_active)}
                      className={`p-1 rounded text-stone-400 hover:text-white transition-colors ${
                        !isAdmin ? "opacity-40 cursor-not-allowed" : ""
                      }`}
                      title={!isAdmin ? "Apenas admin pode alterar disponibilidade" : product.is_active ? "Pausar item" : "Reativar item"}
                    >
                      {product.is_active ? (
                        <ToggleRight className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-stone-600" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
