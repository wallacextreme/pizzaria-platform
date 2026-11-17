"use client";

import * as React from "react";
import type {
  Category,
  DeliveryZone,
  HalfAndHalfRule,
  Product,
  StoreManualOverride,
} from "@/types/domain";
import { formatCurrency, parseBRLInputToCents } from "@/domain/currency";
import { MOCK_CATEGORIES, MOCK_DELIVERY_ZONES } from "@/lib/mockData";
import { publishRealtimeSync } from "@/lib/realtimeBroadcast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAdminAuthStore } from "@/store/adminAuthStore";
import { ProductFormModal } from "./ProductFormModal";
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
  Plus,
  Pencil,
  Scale,
  MapPin,
  Save,
} from "lucide-react";
import { audioNotifier } from "@/lib/audioNotifier";

interface ProductManagementProps {
  initialProducts: Product[];
  categories?: Category[];
  storeStatus: StoreManualOverride;
  onStoreStatusChange: (newStatus: StoreManualOverride) => void;
  halfAndHalfRule?: HalfAndHalfRule;
  onHalfAndHalfRuleChange?: (newRule: HalfAndHalfRule) => void;
  deliveryZones?: DeliveryZone[];
  onDeliveryZonesChange?: (zones: DeliveryZone[]) => void;
  onProductsChange?: (products: Product[]) => void;
}

export function ProductManagement({
  initialProducts,
  categories = MOCK_CATEGORIES,
  storeStatus,
  onStoreStatusChange,
  halfAndHalfRule = "maior_valor",
  onHalfAndHalfRuleChange,
  deliveryZones = MOCK_DELIVERY_ZONES,
  onDeliveryZonesChange,
  onProductsChange,
}: ProductManagementProps) {
  const { user } = useAdminAuthStore();
  const isAdmin = user?.role === "admin";

  const [products, setProducts] = React.useState<Product[]>(initialProducts);
  const [zones, setZones] = React.useState<DeliveryZone[]>(deliveryZones);
  const [zoneDrafts, setZoneDrafts] = React.useState<
    Record<string, { feeRaw: string; minutes: string }>
  >({});

  const [audioMuted, setAudioMuted] = React.useState(audioNotifier.getIsMuted());
  const [audioVolume, setAudioVolume] = React.useState(Math.round(audioNotifier.getVolume() * 100));
  const [audioFeedback, setAudioFeedback] = React.useState(false);

  const [isUpdatingProduct, setIsUpdatingProduct] = React.useState<string | null>(null);
  const [isUpdatingStore, setIsUpdatingStore] = React.useState(false);
  const [isUpdatingRule, setIsUpdatingRule] = React.useState(false);
  const [savingZoneId, setSavingZoneId] = React.useState<string | null>(null);

  const [isProductModalOpen, setIsProductModalOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [feedbackMessage, setFeedbackMessage] = React.useState<{
    text: string;
    isError?: boolean;
  } | null>(null);

  React.useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  React.useEffect(() => {
    setZones(deliveryZones);
    const drafts: Record<string, { feeRaw: string; minutes: string }> = {};
    deliveryZones.forEach((z) => {
      drafts[z.id] = {
        feeRaw: (z.fee_cents / 100).toFixed(2).replace(".", ","),
        minutes: String(z.estimated_time_minutes),
      };
    });
    setZoneDrafts(drafts);
  }, [deliveryZones]);

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
        const updatedList = products.map((p) =>
          p.id === productId ? { ...p, is_active: nextActive } : p
        );
        setProducts(updatedList);
        onProductsChange?.(updatedList);
        publishRealtimeSync("products");
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

  // Alterar Status Operacional da Loja
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
        publishRealtimeSync("store_settings");
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

  // Alterar Regra Meio a Meio (Maior Valor vs Média Ponderada)
  const handleRuleChange = async (nextRule: HalfAndHalfRule) => {
    if (!isAdmin) {
      showFeedback("Apenas administradores podem alterar a regra de precificação.", true);
      return;
    }

    if (nextRule === halfAndHalfRule) return;

    setIsUpdatingRule(true);
    try {
      const res = await fetch("/api/store/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ half_and_half_pricing_rule: nextRule }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onHalfAndHalfRuleChange?.(nextRule);
        publishRealtimeSync("store_settings");
        showFeedback(
          `Regra Meio a Meio alterada para "${
            nextRule === "maior_valor" ? "Maior Valor" : "Média Ponderada"
          }".`
        );
      } else {
        showFeedback(data.error || "Falha ao atualizar regra de meio a meio.", true);
      }
    } catch {
      showFeedback("Erro de conexão ao atualizar regra de precificação.", true);
    } finally {
      setIsUpdatingRule(false);
    }
  };

  // Salvar Taxa e Tempo de Zona de Entrega
  const handleSaveZone = async (zoneId: string) => {
    if (!isAdmin) {
      showFeedback("Apenas administradores podem editar taxas de entrega.", true);
      return;
    }

    const draft = zoneDrafts[zoneId];
    if (!draft) return;

    const feeCents = parseBRLInputToCents(draft.feeRaw);
    const estimatedMin = parseInt(draft.minutes, 10);

    if (feeCents === undefined || feeCents < 0 || !Number.isInteger(estimatedMin) || estimatedMin <= 0) {
      showFeedback("Informe uma taxa válida e um tempo estimado maior que zero.", true);
      return;
    }

    setSavingZoneId(zoneId);
    try {
      const res = await fetch("/api/store/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delivery_zone: {
            id: zoneId,
            fee_cents: feeCents,
            estimated_time_minutes: estimatedMin,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.deliveryZones)) {
        setZones(data.deliveryZones);
        onDeliveryZonesChange?.(data.deliveryZones);
        publishRealtimeSync("store_settings");
        showFeedback("Zona de entrega atualizada e sincronizada com o checkout!");
      } else {
        showFeedback(data.error || "Erro ao atualizar zona de entrega.", true);
      }
    } catch {
      showFeedback("Erro de conexão ao atualizar zona de entrega.", true);
    } finally {
      setSavingZoneId(null);
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

  const handleProductSaved = (savedProduct: Product, mode: "create" | "edit") => {
    const nextList =
      mode === "create"
        ? [savedProduct, ...products]
        : products.map((p) => (p.id === savedProduct.id ? savedProduct : p));
    setProducts(nextList);
    onProductsChange?.(nextList);
    showFeedback(
      mode === "create"
        ? `Produto "${savedProduct.name}" adicionado ao cardápio!`
        : `Produto "${savedProduct.name}" atualizado com sucesso!`
    );
  };

  return (
    <div className="space-y-6">
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

      {/* Controles de Operação da Loja, Meio a Meio & Áudio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status Manual de Funcionamento */}
        <div className="p-4 rounded-2xl bg-pizza-charcoal-card border border-pizza-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-pizza-terracotta" />
              <span className="text-xs font-bold text-pizza-cream">
                Status da Loja (Override)
              </span>
            </div>
            {isUpdatingStore && <Loader2 className="w-3.5 h-3.5 animate-spin text-pizza-gold" />}
          </div>
          <p className="text-[11px] text-stone-400">
            Define se o cardápio aceita pedidos imediatamente ou segue a grade horária automática.
          </p>
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {(["auto", "aberto", "fechado"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                disabled={isUpdatingStore || !isAdmin}
                onClick={() => handleStoreStatusChange(mode)}
                className={`px-2 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                  storeStatus === mode
                    ? mode === "aberto"
                      ? "bg-emerald-950/60 border-emerald-500 text-emerald-400"
                      : mode === "fechado"
                      ? "bg-red-950/60 border-red-500 text-red-400"
                      : "bg-pizza-terracotta/20 border-pizza-terracotta text-pizza-cream"
                    : "border-white/5 bg-black/20 text-stone-400 hover:text-white"
                } ${!isAdmin ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {mode === "auto" ? "Automático" : mode === "aberto" ? "Aberto" : "Fechado"}
              </button>
            ))}
          </div>
        </div>

        {/* Regra de Precificação Meio a Meio */}
        <div className="p-4 rounded-2xl bg-pizza-charcoal-card border border-pizza-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-pizza-gold" />
              <span className="text-xs font-bold text-pizza-cream">
                Regra Pizza Meio a Meio
              </span>
            </div>
            {isUpdatingRule && <Loader2 className="w-3.5 h-3.5 animate-spin text-pizza-gold" />}
          </div>
          <p className="text-[11px] text-stone-400">
            Controla ao vivo o cálculo de 2 sabores na loja e no servidor.
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              disabled={isUpdatingRule || !isAdmin}
              onClick={() => handleRuleChange("maior_valor")}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                halfAndHalfRule === "maior_valor"
                  ? "bg-pizza-terracotta/20 border-pizza-terracotta text-pizza-cream"
                  : "border-white/5 bg-black/20 text-stone-400 hover:text-white"
              } ${!isAdmin ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Maior Valor
            </button>
            <button
              type="button"
              disabled={isUpdatingRule || !isAdmin}
              onClick={() => handleRuleChange("media_ponderada")}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                halfAndHalfRule === "media_ponderada"
                  ? "bg-pizza-gold/20 border-pizza-gold text-pizza-cream"
                  : "border-white/5 bg-black/20 text-stone-400 hover:text-white"
              } ${!isAdmin ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Média Ponderada
            </button>
          </div>
        </div>

        {/* Alerta Sonoro de Cozinha */}
        <div className="p-4 rounded-2xl bg-pizza-charcoal-card border border-pizza-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume1 className="w-4 h-4 text-pizza-gold" />
              <span className="text-xs font-bold text-pizza-cream">
                Alerta Sonoro da Cozinha
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
              <span className="font-bold text-pizza-gold tabular-nums">{audioVolume}%</span>
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

      {/* Gestão do Cardápio (Pausar / Reativar / Cadastrar / Editar com WebP) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-pizza-charcoal-card border border-pizza-border space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Pizza className="w-5 h-5 text-pizza-terracotta" />
            <span className="text-sm font-bold text-pizza-cream">Cardápio &amp; Disponibilidade</span>
            <Badge variant="outline" className="text-xs tabular-nums">
              {products.filter((p) => p.is_active).length} ativos / {products.length} total
            </Badge>
          </div>

          {isAdmin && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              className="text-xs font-bold gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Produto</span>
            </Button>
          )}
        </div>

        <div className="divide-y divide-white/5">
          {products.map((product) => {
            const basePrice = product.sizes[0]?.price_cents || 0;
            const isPending = isUpdatingProduct === product.id;

            return (
              <div
                key={product.id}
                className="py-3 flex flex-wrap items-center justify-between gap-4 transition-colors hover:bg-white/[0.02] px-2 rounded-xl"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden shrink-0 relative">
                    <Pizza className="w-5 h-5 text-pizza-terracotta/50" />
                    {product.images[0] && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-xs sm:text-sm font-bold truncate ${
                        product.is_active ? "text-pizza-cream" : "text-stone-500 line-through"
                      }`}
                    >
                      {product.name}
                    </p>
                    <p className="text-[11px] text-pizza-gold tabular-nums">
                      A partir de {formatCurrency(basePrice)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={product.is_active ? "success" : "outline"} className="text-[10px]">
                    {product.is_active ? "Disponível" : "Pausado"}
                  </Badge>

                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingProduct(product);
                        setIsProductModalOpen(true);
                      }}
                      className="h-8 px-2 text-xs text-stone-300 hover:text-white"
                      title="Editar produto e foto WebP"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  )}

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
                      title={
                        !isAdmin
                          ? "Apenas admin pode alterar disponibilidade"
                          : product.is_active
                          ? "Pausar item"
                          : "Reativar item"
                      }
                    >
                      {product.is_active ? (
                        <ToggleRight className="w-7 h-7 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-stone-600" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gestão de Taxas e Prazos por Bairro (DeliveryZone) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-pizza-charcoal-card border border-pizza-border space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-pizza-gold" />
            <span className="text-sm font-bold text-pizza-cream">Zonas e Taxas de Entrega por Bairro</span>
          </div>
          <Badge variant="outline" className="text-xs tabular-nums">
            {zones.length} bairros
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {zones.map((zone) => {
            const draft = zoneDrafts[zone.id] || {
              feeRaw: (zone.fee_cents / 100).toFixed(2).replace(".", ","),
              minutes: String(zone.estimated_time_minutes),
            };
            const isSavingZone = savingZoneId === zone.id;

            return (
              <div
                key={zone.id}
                className="p-3 rounded-xl bg-pizza-charcoal border border-pizza-border flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <span className="font-bold text-pizza-cream min-w-[130px]">
                  {zone.neighborhood}
                </span>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-[11px] text-stone-400">
                    <span>R$</span>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={draft.feeRaw}
                      onChange={(e) =>
                        setZoneDrafts((prev) => ({
                          ...prev,
                          [zone.id]: { ...draft, feeRaw: e.target.value },
                        }))
                      }
                      aria-label={`Taxa de entrega ${zone.neighborhood}`}
                      className="w-16 h-8 px-2 rounded-lg bg-pizza-charcoal-card border border-pizza-border text-pizza-cream text-right tabular-nums"
                    />
                  </label>

                  <label className="flex items-center gap-1 text-[11px] text-stone-400">
                    <input
                      type="number"
                      min={10}
                      max={180}
                      disabled={!isAdmin}
                      value={draft.minutes}
                      onChange={(e) =>
                        setZoneDrafts((prev) => ({
                          ...prev,
                          [zone.id]: { ...draft, minutes: e.target.value },
                        }))
                      }
                      aria-label={`Tempo estimado ${zone.neighborhood}`}
                      className="w-14 h-8 px-2 rounded-lg bg-pizza-charcoal-card border border-pizza-border text-pizza-cream text-right tabular-nums"
                    />
                    <span>min</span>
                  </label>

                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={isSavingZone}
                      onClick={() => handleSaveZone(zone.id)}
                      className="h-8 px-2.5 text-xs"
                      title={`Salvar ${zone.neighborhood}`}
                    >
                      {isSavingZone ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Cadastro / Edição de Produto com Pipeline WebP */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        productToEdit={editingProduct}
        categories={categories}
        onSaved={handleProductSaved}
      />
    </div>
  );
}
