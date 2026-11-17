"use client";

import * as React from "react";
import { useCartStore } from "@/store/cartStore";
import { formatCentsToBRL, parseBRLInputToCents } from "@/domain/currency";
import { formatOrderForWhatsApp, generateWhatsAppUrl } from "@/domain/whatsapp";
import { fetchAddressByCep } from "@/lib/viacep";
import { MOCK_DELIVERY_ZONES, MOCK_STORE_SETTINGS } from "@/lib/mockData";
import { createDemoOrder } from "@/lib/demoSandboxStore";
import { publishRealtimeSync } from "@/lib/realtimeBroadcast";
import type {
  DeliveryType,
  PaymentMethod,
  Order,
  DeliveryZone,
  StoreSettings,
} from "@/types/domain";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import {
  Bike,
  Store,
  QrCode,
  CreditCard,
  Banknote,
  Send,
  MessageSquare,
  AlertCircle,
  Loader2,
  Clock,
  CheckCircle2,
  MapPin,
} from "lucide-react";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveryZones?: DeliveryZone[];
  settings?: StoreSettings;
  demoMode?: boolean;
  onOrderCreatedDemo?: (order: Order) => void;
}

export function CheckoutModal({
  isOpen,
  onClose,
  deliveryZones,
  settings,
  demoMode = false,
  onOrderCreatedDemo,
}: CheckoutModalProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { items, getSubtotalCents, clearCart, closeCart } = useCartStore();

  const activeZones = React.useMemo(() => {
    const source = deliveryZones && deliveryZones.length > 0 ? deliveryZones : MOCK_DELIVERY_ZONES;
    const enabled = source.filter((z) => z.active);
    return enabled.length > 0 ? enabled : source;
  }, [deliveryZones]);

  const activeSettings = settings || MOCK_STORE_SETTINGS;
  const subtotalCents = getSubtotalCents();

  // Estados do Formulário de Checkout
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [deliveryType, setDeliveryType] = React.useState<DeliveryType>("delivery");

  // Endereço
  const [cep, setCep] = React.useState("");
  const [street, setStreet] = React.useState("");
  const [number, setNumber] = React.useState("");
  const [complement, setComplement] = React.useState("");
  const [neighborhood, setNeighborhood] = React.useState(
    activeZones[0]?.neighborhood || "Vila Gastronômica"
  );
  const [city, setCity] = React.useState("São Paulo");
  const [state, setState] = React.useState("SP");
  const [reference, setReference] = React.useState("");

  // Pagamento
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("pix");
  const [needsChange, setNeedsChange] = React.useState(false);
  const [changeForRaw, setChangeForRaw] = React.useState("");

  // UI States
  const [isLoadingCep, setIsLoadingCep] = React.useState(false);
  const [cepError, setCepError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  /**
   * REGRA DE NEGÓCIO — TAXA DE ENTREGA POR BAIRRO (DeliveryZone):
   * 1. Para modalidade 'retirada', a taxa de entrega é sempre R$ 0,00 (0 centavos).
   * 2. Para 'delivery', a zona é localizada pelo bairro selecionado (case-insensitive)
   *    nas zonas ativas configuradas pelo administrador.
   * 3. Cada zona define `fee_cents` (inteiro em centavos) e `estimated_time_minutes`.
   * 4. Caso o CEP preencha um bairro fora da lista ou haja divergência, o servidor
   *    (`orderValidator.ts`) recalcula a taxa autoritativa no momento do POST /api/orders.
   */
  const deliveryZone = React.useMemo(() => {
    if (deliveryType === "retirada") return null;
    return (
      activeZones.find(
        (z) => z.neighborhood.trim().toLowerCase() === neighborhood.trim().toLowerCase()
      ) || activeZones[0] || null
    );
  }, [deliveryType, neighborhood, activeZones]);

  const deliveryFeeCents = React.useMemo(() => {
    if (deliveryType === "retirada") return 0;
    return deliveryZone?.fee_cents ?? 500;
  }, [deliveryType, deliveryZone]);

  const estimatedMinutes = deliveryZone?.estimated_time_minutes ?? activeSettings.delivery_settings.default_estimated_time_min ?? 45;
  const totalCents = subtotalCents + deliveryFeeCents;
  const changeForCents = needsChange ? parseBRLInputToCents(changeForRaw) : undefined;

  // Busca de CEP com Auto-Fill e Fallback Manual Resiliente
  const handleCepLookup = async (cepInput: string) => {
    const clean = cepInput.replace(/\D/g, "");
    if (clean.length === 8) {
      setIsLoadingCep(true);
      setCepError(null);
      try {
        const addr = await fetchAddressByCep(clean);
        if (addr) {
          setStreet(addr.street);
          if (addr.neighborhood) {
            const matchedZone = activeZones.find(
              (z) => z.neighborhood.toLowerCase() === addr.neighborhood.toLowerCase()
            );
            if (matchedZone) {
              setNeighborhood(matchedZone.neighborhood);
            }
          }
          setCity(addr.city);
          setState(addr.state);
          showToast("Endereço localizado via CEP com sucesso!", "success");
        } else {
          setCepError("CEP não encontrado. Preencha o endereço manualmente abaixo.");
        }
      } catch {
        setCepError("Serviço de CEP temporariamente indisponível. Preencha manualmente.");
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  // Envio e Finalização do Pedido
  const handleSubmitOrder = async (channel: "web" | "whatsapp") => {
    setErrorMessage(null);

    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage("Por favor, informe seu nome completo.");
      return;
    }

    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
      setErrorMessage("Por favor, informe um telefone válido com DDD (WhatsApp).");
      return;
    }

    if (deliveryType === "delivery") {
      if (!street.trim() || !number.trim() || !neighborhood.trim()) {
        setErrorMessage("Por favor, informe rua, número e bairro para a entrega.");
        return;
      }
    }

    if (paymentMethod === "dinheiro" && needsChange) {
      if (!changeForCents || changeForCents < totalCents) {
        setErrorMessage(
          `O valor para troco deve ser maior ou igual ao total de ${formatCentsToBRL(totalCents)}.`
        );
        return;
      }
    }

    setIsSubmitting(true);

    // Monta payload de intenção para validação e recálculo no servidor
    const payload = {
      customer: {
        name: name.trim(),
        phone: phone.trim(),
      },
      delivery_type: deliveryType,
      address:
        deliveryType === "delivery"
          ? {
              street: street.trim(),
              number: number.trim(),
              complement: complement.trim() || undefined,
              neighborhood: neighborhood.trim(),
              city: city.trim(),
              state: state.trim(),
              postal_code: cep.replace(/\D/g, "") || "00000000",
              reference: reference.trim() || undefined,
            }
          : undefined,
      items: items.map((item) => ({
        product_id: item.product_id,
        is_pizza: item.is_pizza,
        size_id: item.size?.id,
        flavor_ids: item.flavors.map((f) => f.product_id),
        crust_id: item.crust?.id,
        extra_ids: item.extras.map((e) => e.id),
        removed_ingredients: item.removed_ingredients,
        notes: item.notes,
        quantity: item.quantity,
        client_declared_total_cents: item.total_price_cents,
      })),
      payment_method: paymentMethod,
      change_for_cents: changeForCents,
      fulfillment_channel: channel,
    };

    try {
      const useClientDemo = demoMode || process.env.NEXT_PUBLIC_DEMO_STATIC === "true";
      let createdOrder: Order;

      if (useClientDemo) {
        const result = createDemoOrder(payload);
        createdOrder = result.order;
      } else {
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Erro ao processar seu pedido no servidor.");
        }

        createdOrder = data.order;

        // Notifica imediatamente qualquer aba do painel admin aberta via BroadcastChannel
        publishRealtimeSync("orders", createdOrder.id);
      }

      clearCart();
      closeCart();
      onClose();

      showToast(`Pedido ${createdOrder.display_id} confirmado com sucesso!`, "success");

      if (channel === "whatsapp" && !useClientDemo) {
        const message = formatOrderForWhatsApp(createdOrder);
        const whatsappUrl = generateWhatsAppUrl(activeSettings.whatsapp_number, message);
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      }

      if (onOrderCreatedDemo) {
        onOrderCreatedDemo(createdOrder);
      } else if (useClientDemo) {
        router.push(`/demo?track=${encodeURIComponent(createdOrder.id)}`);
      } else {
        router.push(`/pedido/${createdOrder.id}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Erro inesperado ao conectar ao servidor.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Finalizar Pedido"
      description="Informe seus dados para entrega ou retirada rápida no balcão."
      maxWidth="lg"
      className="max-h-[92vh] overflow-y-auto"
    >
      <div className="space-y-6 text-left py-2">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. SELEÇÃO DE MODALIDADE */}
        <div className="grid grid-cols-2 gap-3 p-1 bg-pizza-charcoal rounded-2xl border border-pizza-border">
          <button
            type="button"
            onClick={() => setDeliveryType("delivery")}
            className={`flex items-center justify-center gap-2 py-3 min-h-[44px] rounded-xl text-xs font-bold transition-all ${
              deliveryType === "delivery"
                ? "bg-pizza-terracotta text-white shadow-lg shadow-pizza-terracotta/20"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <Bike className="w-4 h-4" />
            <span>Delivery em Casa</span>
          </button>
          <button
            type="button"
            onClick={() => setDeliveryType("retirada")}
            className={`flex items-center justify-center gap-2 py-3 min-h-[44px] rounded-xl text-xs font-bold transition-all ${
              deliveryType === "retirada"
                ? "bg-pizza-terracotta text-white shadow-lg shadow-pizza-terracotta/20"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Retirada no Balcão</span>
          </button>
        </div>

        {/* 2. DADOS PESSOAIS */}
        <section className="space-y-3">
          <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider">
            Seus Dados de Contato
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nome Completo"
              placeholder="Ex: João da Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="WhatsApp / Telefone"
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </section>

        {/* 3. ENDEREÇO OU RETIRADA */}
        {deliveryType === "delivery" ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                Endereço de Entrega
              </h4>
              {isLoadingCep && (
                <span className="text-xs text-pizza-gold flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Buscando CEP...
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="CEP"
                placeholder="00000-000"
                value={cep}
                onChange={(e) => {
                  setCep(e.target.value);
                  handleCepLookup(e.target.value);
                }}
                error={cepError || undefined}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Rua / Avenida"
                  placeholder="Nome da sua rua"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input
                label="Número"
                placeholder="123"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
              />
              <Input
                label="Complemento"
                placeholder="Apto, Bloco"
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
              />
              <div className="col-span-2 space-y-1.5 text-left">
                <label
                  htmlFor="neighborhood-select"
                  className="block text-xs font-semibold text-stone-300 uppercase tracking-wider"
                >
                  Bairro (Zona de Entrega)
                </label>
                <select
                  id="neighborhood-select"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full h-11 px-3 bg-pizza-charcoal border border-pizza-border rounded-xl text-sm text-pizza-cream focus:outline-none focus:ring-2 focus:ring-pizza-terracotta tabular-nums"
                >
                  {activeZones.map((zone) => (
                    <option key={zone.id} value={zone.neighborhood}>
                      {zone.neighborhood} ({formatCentsToBRL(zone.fee_cents)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label="Ponto de Referência (Opcional)"
              placeholder="Ex: Próximo ao supermercado, portão verde..."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />

            {/* Informações Dinâmicas da Zona de Entrega */}
            <div className="p-3 rounded-xl bg-pizza-charcoal border border-pizza-border flex items-center justify-between text-xs tabular-nums">
              <div className="flex items-center gap-2 text-stone-300">
                <Clock className="w-4 h-4 text-pizza-gold" />
                <span>
                  Previsão de entrega:{" "}
                  <strong>
                    {Math.max(20, estimatedMinutes - 5)} a {estimatedMinutes + 10} min
                  </strong>
                </span>
              </div>
              <Badge variant="terracotta">
                Taxa: {formatCentsToBRL(deliveryFeeCents)}
              </Badge>
            </div>
          </section>
        ) : (
          <div className="p-4 rounded-2xl bg-pizza-charcoal border border-pizza-border space-y-2">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-pizza-terracotta shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <h5 className="font-bold text-pizza-cream text-sm">
                  Retirada no Balcão da Pizzaria
                </h5>
                <p className="text-stone-400">
                  Rua das Pizzas Artesanais, 1000 — Vila Gastronômica, São Paulo - SP
                </p>
                <p className="text-emerald-400 font-semibold pt-1">
                  Sem taxa de entrega • Pronto em cerca de 20 a 30 minutos
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 4. FORMAS DE PAGAMENTO */}
        <section className="space-y-3">
          <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider">
            Forma de Pagamento
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("pix")}
              className={`p-3 min-h-[60px] rounded-xl border text-center transition-colors flex flex-col items-center justify-center gap-1.5 ${
                paymentMethod === "pix"
                  ? "bg-pizza-terracotta/20 border-pizza-terracotta text-white font-bold"
                  : "bg-pizza-charcoal border-pizza-border text-stone-400 hover:border-stone-600"
              }`}
            >
              <QrCode className="w-5 h-5 text-pizza-gold" />
              <span className="text-xs">PIX</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("cartao")}
              className={`p-3 min-h-[60px] rounded-xl border text-center transition-colors flex flex-col items-center justify-center gap-1.5 ${
                paymentMethod === "cartao"
                  ? "bg-pizza-terracotta/20 border-pizza-terracotta text-white font-bold"
                  : "bg-pizza-charcoal border-pizza-border text-stone-400 hover:border-stone-600"
              }`}
            >
              <CreditCard className="w-5 h-5 text-pizza-terracotta" />
              <span className="text-xs">Cartão</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("dinheiro")}
              className={`p-3 min-h-[60px] rounded-xl border text-center transition-colors flex flex-col items-center justify-center gap-1.5 ${
                paymentMethod === "dinheiro"
                  ? "bg-pizza-terracotta/20 border-pizza-terracotta text-white font-bold"
                  : "bg-pizza-charcoal border-pizza-border text-stone-400 hover:border-stone-600"
              }`}
            >
              <Banknote className="w-5 h-5 text-emerald-400" />
              <span className="text-xs">Dinheiro</span>
            </button>
          </div>

          {paymentMethod === "dinheiro" && (
            <div className="p-3.5 rounded-xl bg-pizza-charcoal border border-pizza-border space-y-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-pizza-cream cursor-pointer">
                <input
                  type="checkbox"
                  checked={needsChange}
                  onChange={(e) => setNeedsChange(e.target.checked)}
                  className="rounded bg-pizza-charcoal-card border-pizza-border text-pizza-terracotta focus:ring-pizza-terracotta"
                />
                <span>Preciso de troco</span>
              </label>

              {needsChange && (
                <div className="space-y-2 pt-1">
                  <Input
                    label="Troco para quanto?"
                    placeholder="Ex: 100,00"
                    value={changeForRaw}
                    onChange={(e) => setChangeForRaw(e.target.value)}
                    helperText={`Total atual do pedido: ${formatCentsToBRL(totalCents)}`}
                  />
                  {changeForCents && changeForCents >= totalCents && (
                    <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 tabular-nums">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        Levar troco de: {formatCentsToBRL(changeForCents - totalCents)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {paymentMethod === "pix" && (
            <div className="p-3.5 rounded-xl bg-pizza-charcoal border border-pizza-border space-y-2 text-xs text-stone-300">
              <p className="font-semibold text-pizza-cream flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-pizza-gold" />
                PIX Instantâneo
              </p>
              <p className="text-stone-400 text-[11px]">
                O QR Code e chave Pix copia-e-cola serão gerados imediatamente na tela seguinte para você pagar com facilidade.
              </p>
            </div>
          )}
        </section>

        {/* 5. RESUMO DE VALORES E BOTÕES DE ENVIO */}
        <div className="pt-4 border-t border-pizza-border space-y-4">
          <div className="p-3.5 rounded-xl bg-pizza-charcoal border border-pizza-border space-y-1.5 text-xs tabular-nums">
            <div className="flex justify-between text-stone-400">
              <span>Subtotal dos Itens</span>
              <span className="text-pizza-cream font-medium">
                {formatCentsToBRL(subtotalCents)}
              </span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Taxa de Entrega</span>
              <span className="text-pizza-cream font-medium">
                {deliveryType === "delivery" ? formatCentsToBRL(deliveryFeeCents) : "Grátis"}
              </span>
            </div>
            <div className="pt-2 border-t border-pizza-border flex justify-between items-baseline font-black text-base text-pizza-cream">
              <span>Total a Pagar</span>
              <span className="text-pizza-gold text-lg">{formatCentsToBRL(totalCents)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="gold"
              size="lg"
              isLoading={isSubmitting}
              onClick={() => handleSubmitOrder("whatsapp")}
              className="w-full font-bold text-xs gap-2 min-h-[44px]"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Pedir via WhatsApp</span>
            </Button>

            <Button
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              onClick={() => handleSubmitOrder("web")}
              className="w-full font-bold text-xs gap-2 min-h-[44px]"
            >
              <Send className="w-4 h-4" />
              <span>Enviar para a Cozinha</span>
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
