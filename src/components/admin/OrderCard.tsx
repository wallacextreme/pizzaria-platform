"use client";

import * as React from "react";
import type { Order, OrderStatus } from "@/types/domain";
import { formatCurrency } from "@/domain/currency";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Clock,
  MapPin,
  Phone,
  ArrowRight,
  ArrowLeft,
  XCircle,
  Flame,
  Bike,
  CheckCircle2,
  ChefHat,
  MessageCircle,
} from "lucide-react";

interface OrderCardProps {
  order: Order;
  onStatusChange: (id: string, newStatus: OrderStatus) => void;
}

const NEXT_STATUS_MAP: Record<OrderStatus, OrderStatus | null> = {
  novo: "em_preparo",
  em_preparo: "no_forno",
  no_forno: "saiu_para_entrega",
  saiu_para_entrega: "concluido",
  concluido: null,
  cancelado: null,
};

const PREV_STATUS_MAP: Record<OrderStatus, OrderStatus | null> = {
  novo: null,
  em_preparo: "novo",
  no_forno: "em_preparo",
  saiu_para_entrega: "no_forno",
  concluido: "saiu_para_entrega",
  cancelado: null,
};

const NEXT_STATUS_LABEL: Record<OrderStatus, string> = {
  novo: "Iniciar Preparo",
  em_preparo: "Levar ao Forno",
  no_forno: "Despachar",
  saiu_para_entrega: "Concluir Entrega",
  concluido: "",
  cancelado: "",
};

const NEXT_STATUS_ICON: Record<OrderStatus, React.ElementType> = {
  novo: ChefHat,
  em_preparo: Flame,
  no_forno: Bike,
  saiu_para_entrega: CheckCircle2,
  concluido: CheckCircle2,
  cancelado: XCircle,
};

export function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const [elapsedMinutes, setElapsedMinutes] = React.useState<number>(0);

  // Calcula tempo decorrido
  React.useEffect(() => {
    const calculateElapsed = () => {
      const created = new Date(order.created_at).getTime();
      const now = Date.now();
      const diffMin = Math.floor((now - created) / 60000);
      setElapsedMinutes(Math.max(0, diffMin));
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 30000);
    return () => clearInterval(interval);
  }, [order.created_at]);

  const nextStatus = NEXT_STATUS_MAP[order.status];
  const prevStatus = PREV_STATUS_MAP[order.status];
  const NextIcon = NEXT_STATUS_ICON[order.status];

  // Cores por tempo de espera
  const isDelayed = elapsedMinutes >= 40;
  const isWarning = elapsedMinutes >= 20 && !isDelayed;

  const cleanPhone = order.customer.phone.replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/55${cleanPhone}`;

  return (
    <div
      className={`rounded-2xl border bg-pizza-charcoal-card p-4 space-y-3 shadow-md transition-all ${
        isDelayed
          ? "border-red-500/60 bg-red-950/20"
          : isWarning
          ? "border-pizza-gold/60 bg-amber-950/15"
          : "border-pizza-border hover:border-stone-600"
      }`}
    >
      {/* Top Header: ID, Modalidade e Tempo */}
      <div className="flex items-start justify-between gap-2 border-b border-white/5 pb-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="font-serif font-black text-pizza-gold text-base tracking-wide">
              {order.display_id}
            </span>
            <Badge
              variant={order.delivery_type === "delivery" ? "terracotta" : "outline"}
              className="text-[10px] uppercase font-bold py-0.5"
            >
              {order.delivery_type === "delivery" ? "Delivery" : "Retirada"}
            </Badge>
          </div>
          <p className="text-xs font-bold text-pizza-cream truncate max-w-[180px]">
            {order.customer.name}
          </p>
        </div>

        {/* Timer Decorrido */}
        <div
          className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
            isDelayed
              ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
              : isWarning
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              : "bg-black/30 text-stone-400 border border-white/5"
          }`}
          title={`Pedido criado há ${elapsedMinutes} minutos`}
        >
          <Clock className="w-3 h-3" />
          <span>{elapsedMinutes}m</span>
        </div>
      </div>

      {/* Contato e Endereço */}
      <div className="space-y-1 text-[11px] text-stone-400">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Phone className="w-3 h-3 text-stone-500" />
            <span>{order.customer.phone}</span>
          </span>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
            title="Conversar no WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold">WhatsApp</span>
          </a>
        </div>

        {order.address && (
          <p className="flex items-start gap-1 truncate text-stone-300">
            <MapPin className="w-3 h-3 text-pizza-terracotta shrink-0 mt-0.5" />
            <span className="truncate">
              {order.address.street}, {order.address.number} - {order.address.neighborhood}
            </span>
          </p>
        )}
      </div>

      {/* Itens do Pedido (Cozinha & Montagem) */}
      <div className="space-y-2 border-t border-b border-white/5 py-2">
        {order.items.map((item, idx) => (
          <div key={idx} className="space-y-1 text-xs">
            <div className="flex justify-between font-bold text-pizza-cream">
              <span>
                {item.quantity}x {item.name}
              </span>
              <span className="text-stone-400 font-normal">
                {formatCurrency(item.total_price_cents)}
              </span>
            </div>

            {/* Sabores Meio a Meio */}
            {item.flavors && item.flavors.length > 1 && (
              <div className="text-[11px] text-stone-400 pl-2">
                ½ {item.flavors[0]?.name} + ½ {item.flavors[1]?.name}
              </div>
            )}

            {/* Borda Recheada */}
            {item.crust && (
              <div className="text-[10px] text-pizza-gold pl-2">
                Borda: {item.crust.name}
              </div>
            )}

            {/* Ingredientes Removidos (DESTAQUE PARA COZINHA) */}
            {item.removed_ingredients && item.removed_ingredients.length > 0 && (
              <div className="flex flex-wrap gap-1 pl-2 pt-0.5">
                {item.removed_ingredients.map((ing, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-red-900/40 border border-red-500/50 text-[10px] font-bold text-red-300"
                  >
                    <span>SEM {ing.toUpperCase()}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Adicionais */}
            {item.extras && item.extras.length > 0 && (
              <div className="text-[10px] text-emerald-400 pl-2">
                + {item.extras.map((e) => e.name).join(", ")}
              </div>
            )}

            {/* Observações */}
            {item.notes && (
              <p className="text-[11px] italic text-amber-300/90 pl-2 bg-amber-950/20 py-0.5 px-1 rounded">
                Obs: &quot;{item.notes}&quot;
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Rodapé Financeiro e Pagamento */}
      <div className="flex items-center justify-between text-xs pt-0.5">
        <div className="space-y-0.5">
          <span className="text-[10px] uppercase text-stone-400">Total</span>
          <p className="font-bold text-sm text-pizza-gold">
            {formatCurrency(order.total_cents)}
          </p>
        </div>

        <div className="text-right">
          <Badge variant="outline" className="text-[10px] uppercase">
            {order.payment_method === "pix"
              ? "PIX"
              : order.payment_method === "cartao"
              ? "Cartão"
              : `Dinheiro${order.change_for_cents ? ` (Troco p/ ${formatCurrency(order.change_for_cents)})` : ""}`}
          </Badge>
        </div>
      </div>

      {/* Ações de Transição de Status */}
      <div className="pt-2 flex items-center gap-1.5">
        {prevStatus && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onStatusChange(order.id, prevStatus)}
            className="px-2 py-1 h-8 text-stone-400 hover:text-white"
            title="Voltar para etapa anterior"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </Button>
        )}

        {nextStatus && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => onStatusChange(order.id, nextStatus)}
            className="flex-1 text-xs font-bold gap-1.5 h-8 justify-center"
          >
            <NextIcon className="w-3.5 h-3.5" />
            <span>{NEXT_STATUS_LABEL[order.status]}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-auto" />
          </Button>
        )}

        {order.status !== "concluido" && order.status !== "cancelado" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onStatusChange(order.id, "cancelado")}
            className="px-2 py-1 h-8 text-stone-500 hover:text-red-400"
            title="Cancelar pedido"
          >
            <XCircle className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
