"use client";

import * as React from "react";
import { useCartStore } from "@/store/cartStore";
import { formatCentsToBRL, parseBRLInputToCents } from "@/domain/currency";
import { formatOrderForWhatsApp, generateWhatsAppUrl } from "@/domain/whatsapp";
import { fetchAddressByCep } from "@/lib/viacep";
import { MOCK_DELIVERY_ZONES, MOCK_STORE_SETTINGS } from "@/lib/mockData";
import type { DeliveryType, PaymentMethod, Order } from "@/types/domain";
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
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { items, getSubtotalCents, clearCart, closeCart } = useCartStore();

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
  const [neighborhood, setNeighborhood] = React.useState("Vila Gastronômica");
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

  // Cálculo da Taxa de Entrega
  const deliveryZone = React.useMemo(() => {
    if (deliveryType === "retirada") return null;
    return (
      MOCK_DELIVERY_ZONES.find(
        (z) => z.neighborhood.toLowerCase() === neighborhood.toLowerCase()
      ) || MOCK_DELIVERY_ZONES[0]
    );
  }, [deliveryType, neighborhood]);

  const deliveryFeeCents = React.useMemo(() => {
    if (deliveryType === "retirada") return 0;
    return deliveryZone?.fee_cents || 500;
  }, [deliveryType, deliveryZone]);

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
          setNeighborhood(addr.neighborhood || neighborhood);
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

    // Validações básicas no client antes do envio
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
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erro ao processar seu pedido no servidor.");
      }

      const createdOrder: Order = data.order;

      // Limpa o carrinho
      clearCart();
      closeCart();
      onClose();

      showToast(`Pedido ${createdOrder.display_id} confirmado com sucesso!`, "success");

      if (channel === "whatsapp") {
        const message = formatOrderForWhatsApp(createdOrder);
        const whatsappUrl = generateWhatsAppUrl(MOCK_STORE_SETTINGS.whatsapp_number, message);
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      }

      // Redireciona para tela de confirmação e rastreamento
      router.push(`/pedido/${createdOrder.id}`);
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
        {/* Banner de Erro Geral se houver */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. SELEÇÃO DE MODALIDADE: DELIVERY OU RETIRADA */}
        <div className="grid grid-cols-2 gap-3 p-1 bg-pizza-charcoal rounded-2xl border border-pizza-border">
          <button
            type="button"
            onClick={() => setDeliveryType("delivery")}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
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
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
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

        {/* 3. ENDEREÇO DE ENTREGA OU LOCAL DA RETIRADA */}
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
                  className="w-full h-11 px-3 bg-pizza-charcoal border border-pizza-border rounded-xl text-sm text-pizza-cream focus:outline-none focus:ring-2 focus:ring-pizza-terracotta"
                >
                  {MOCK_DELIVERY_ZONES.map((zone) => (
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

            {/* Informações da Zona de Entrega */}
            <div className="p-3 rounded-xl bg-pizza-charcoal border border-pizza-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-stone-300">
                <Clock className="w-4 h-4 text-pizza-gold" />
                <span>Previsão de entrega: <strong>35 a 50 min</strong></span>
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
                  ✓ Sem taxa de entrega • Pronto em cerca de 20 a 30 minutos
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
              className={`p-3 rounded-xl border text-center transition-colors flex flex-col items-center gap-1.5 ${
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
              className={`p-3 rounded-xl border text-center transition-colors flex flex-col items-center gap-1.5 ${
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
              className={`p-3 rounded-xl border text-center transition-colors flex flex-col items-center gap-1.5 ${
                paymentMethod === "dinheiro"
                  ? "bg-pizza-terracotta/20 border-pizza-terracotta text-white font-bold"
                  : "bg-pizza-charcoal border-pizza-border text-stone-400 hover:border-stone-600"
              }`}
            >
              <Banknote className="w-5 h-5 text-emerald-400" />
              <span className="text-xs">Dinheiro</span>
            </button>
          </div>

          {/* Opções específicas de Dinheiro */}
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
                    <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
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

          {/* Exibição Demonstrativa de PIX */}
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
          <div className="p-3.5 rounded-xl bg-pizza-charcoal border border-pizza-border space-y-1.5 text-xs">
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
              className="w-full font-bold text-xs gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Pedir via WhatsApp</span>
            </Button>

            <Button
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              onClick={() => handleSubmitOrder("web")}
              className="w-full font-bold text-xs gap-2"
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
