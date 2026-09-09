"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import type { Order, OrderStatus } from "@/types/domain";
import { formatCentsToBRL } from "@/domain/currency";
import { formatOrderForWhatsApp, generateWhatsAppUrl } from "@/domain/whatsapp";
import { MOCK_STORE_SETTINGS } from "@/lib/mockData";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  CheckCircle2,
  Bike,
  Store,
  QrCode,
  Copy,
  MessageSquare,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";

const STATUS_STEPS: { status: OrderStatus; label: string; icon: string }[] = [
  { status: "novo", label: "Recebido", icon: "📋" },
  { status: "em_preparo", label: "Em Preparo", icon: "👨‍🍳" },
  { status: "no_forno", label: "No Forno", icon: "🔥" },
  { status: "saiu_para_entrega", label: "A Caminho", icon: "🛵" },
  { status: "concluido", label: "Entregue", icon: "✅" },
];

function OrderTrackingContent() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const orderId = params?.id as string;

  const [order, setOrder] = React.useState<Order | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadOrder() {
      if (!orderId) return;
      try {
        const res = await fetch(`/api/orders?id=${orderId}`);
        const data = await res.json();
        if (res.ok && data.success && data.order) {
          setOrder(data.order);
        } else {
          setError(data.error || "Pedido não encontrado.");
        }
      } catch {
        setError("Erro ao carregar informações do pedido.");
      } finally {
        setIsLoading(false);
      }
    }
    loadOrder();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Loader2 className="w-10 h-10 text-pizza-terracotta animate-spin" />
        <p className="text-sm text-stone-400">Carregando status do seu pedido...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-pizza-cream font-display">
          Não foi possível encontrar o pedido
        </h2>
        <p className="text-xs text-stone-400">{error || "Pedido inexistente."}</p>
        <Button variant="primary" onClick={() => router.push("/")}>
          Voltar ao Cardápio
        </Button>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.status === order.status);
  const pixKeyDemo = "00020126580014BR.GOV.BCB.PIX0136fornomassa-pizzaria-chave-demo5204000053039865802BR5925FORNO E MASSA PIZZARIA6009SAO PAULO62070503***6304E1F4";

  return (
    <div className="min-h-screen bg-pizza-charcoal text-pizza-cream py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8 text-left">
        {/* Top Header com Voltar */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="text-stone-400 hover:text-white gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cardápio</span>
          </Button>

          <Badge variant="success" dot pulse>
            Pedido Confirmado
          </Badge>
        </div>

        {/* Card Principal de Confirmação */}
        <div className="p-6 sm:p-8 rounded-3xl bg-pizza-charcoal-card border border-pizza-border shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-pizza-terracotta/20 border border-pizza-terracotta/40 flex items-center justify-center text-pizza-terracotta">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-pizza-cream font-display">
              Pedido {order.display_id} Recebido!
            </h1>
            <p className="text-xs sm:text-sm text-stone-300">
              Obrigado, <strong className="text-pizza-cream">{order.customer.name}</strong>. Nosso pizzaiolo já recebeu seu pedido.
            </p>
          </div>

          {/* Stepper de Status Operacional */}
          <div className="pt-2">
            <div className="grid grid-cols-5 gap-1 text-center">
              {STATUS_STEPS.map((step, idx) => {
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={step.status} className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all ${
                        isCurrent
                          ? "bg-pizza-terracotta text-white shadow-lg shadow-pizza-terracotta/30 ring-2 ring-pizza-terracotta ring-offset-2 ring-offset-pizza-charcoal-card font-bold"
                          : isPassed
                          ? "bg-pizza-basil/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-pizza-charcoal text-stone-600 border border-pizza-border"
                      }`}
                    >
                      {step.icon}
                    </div>
                    <span
                      className={`text-[10px] font-semibold leading-tight ${
                        isCurrent ? "text-pizza-cream font-bold" : isPassed ? "text-stone-300" : "text-stone-600"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Previsão e Modalidade */}
          <div className="p-4 rounded-2xl bg-pizza-charcoal border border-pizza-border flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              {order.delivery_type === "delivery" ? (
                <Bike className="w-5 h-5 text-pizza-terracotta" />
              ) : (
                <Store className="w-5 h-5 text-pizza-terracotta" />
              )}
              <div>
                <span className="font-bold text-pizza-cream block">
                  {order.delivery_type === "delivery" ? "Entrega Delivery" : "Retirada no Balcão"}
                </span>
                <span className="text-stone-400 text-[11px]">
                  {order.delivery_type === "delivery"
                    ? "Estimativa: 35 a 50 min"
                    : "Estimativa: 20 a 30 min"}
                </span>
              </div>
            </div>
            <span className="text-pizza-gold font-bold">
              {order.delivery_type === "delivery" ? `Taxa: ${formatCentsToBRL(order.delivery_fee_cents)}` : "Grátis"}
            </span>
          </div>

          {/* Se PIX: Chave Copia e Cola Demonstrativa */}
          {order.payment_method === "pix" && (
            <div className="p-4 rounded-2xl bg-pizza-gold/10 border border-pizza-gold/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pizza-gold flex items-center gap-1.5">
                  <QrCode className="w-4 h-4" />
                  PIX — Pagamento Rápido
                </span>
                <Badge variant="warning">Demonstrativo</Badge>
              </div>
              <p className="text-xs text-stone-300">
                Copie a chave Pix abaixo e pague no aplicativo do seu banco:
              </p>
              <div className="flex items-center gap-2 bg-pizza-charcoal p-2.5 rounded-xl border border-pizza-border text-xs">
                <code className="text-[11px] text-stone-400 truncate flex-1 font-mono">
                  {pixKeyDemo}
                </code>
                <Button
                  size="sm"
                  variant="gold"
                  onClick={() => {
                    navigator.clipboard.writeText(pixKeyDemo);
                    showToast("Chave PIX copiada para a área de transferência!", "success");
                  }}
                  className="shrink-0 text-xs gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </Button>
              </div>
            </div>
          )}

          {/* Lista de Itens do Pedido */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-stone-300 uppercase tracking-wider">
              Itens Confirmados
            </h3>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-pizza-charcoal border border-pizza-border flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-pizza-cream block">
                      {item.quantity}x {item.name}
                    </span>
                    {item.size && (
                      <span className="text-[11px] text-pizza-gold block">
                        Tamanho {item.size.name}
                      </span>
                    )}
                    {item.crust && item.crust.price_cents > 0 && (
                      <span className="text-[10px] text-stone-400 block">
                        Borda: {item.crust.name}
                      </span>
                    )}
                    {item.extras && item.extras.length > 0 && (
                      <span className="text-[10px] text-stone-400 block">
                        Extras: {item.extras.map((e) => e.name).join(", ")}
                      </span>
                    )}
                    {item.removed_ingredients && item.removed_ingredients.length > 0 && (
                      <span className="text-[10px] text-red-400 block">
                        Sem: {item.removed_ingredients.join(", ")}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-pizza-cream whitespace-nowrap">
                    {formatCentsToBRL(item.total_price_cents)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Resumo Financeiro */}
          <div className="p-4 rounded-2xl bg-pizza-charcoal border border-pizza-border space-y-2 text-xs">
            <div className="flex justify-between text-stone-400">
              <span>Subtotal</span>
              <span className="text-pizza-cream">{formatCentsToBRL(order.subtotal_cents)}</span>
            </div>
            {order.delivery_type === "delivery" && (
              <div className="flex justify-between text-stone-400">
                <span>Taxa de Entrega</span>
                <span className="text-pizza-cream">{formatCentsToBRL(order.delivery_fee_cents)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-pizza-border flex justify-between items-baseline font-black text-sm text-pizza-cream">
              <span>Total Pago/A Pagar</span>
              <span className="text-pizza-gold text-lg">{formatCentsToBRL(order.total_cents)}</span>
            </div>
            {order.payment_method === "dinheiro" && order.change_for_cents && (
              <div className="pt-1 text-[11px] text-emerald-400 font-semibold flex justify-between">
                <span>Troco solicitado para {formatCentsToBRL(order.change_for_cents)}:</span>
                <span>Levar {formatCentsToBRL(order.change_for_cents - order.total_cents)}</span>
              </div>
            )}
          </div>

          {/* Ações: Reenviar WhatsApp / Novo Pedido */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="gold"
              size="lg"
              className="w-full font-bold text-xs gap-2"
              onClick={() => {
                const message = formatOrderForWhatsApp(order);
                const url = generateWhatsAppUrl(MOCK_STORE_SETTINGS.whatsapp_number, message);
                window.open(url, "_blank", "noopener,noreferrer");
              }}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Abrir no WhatsApp</span>
            </Button>

            <Button
              variant="secondary"
              size="lg"
              className="w-full font-bold text-xs"
              onClick={() => router.push("/")}
            >
              Fazer Novo Pedido
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <ToastProvider>
      <OrderTrackingContent />
    </ToastProvider>
  );
}
