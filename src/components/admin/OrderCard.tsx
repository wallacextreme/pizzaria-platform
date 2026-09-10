"use client";

import * as React from "react";
import type { Order, OrderStatus } from "@/types/domain";
import { formatCurrency } from "@/domain/currency";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { getNextFlowStatus } from "@/domain/orderTransitions";
import {
  Clock,
  MapPin,
  Phone,
  ArrowRight,
  XCircle,
  Flame,
  Bike,
  CheckCircle2,
  ChefHat,
  MessageCircle,
  AlertTriangle,
  ReceiptText,
} from "lucide-react";

interface OrderCardProps {
  order: Order;
  onStatusChange: (id: string, newStatus: OrderStatus) => void;
}

const NEXT_STATUS_LABEL: Record<OrderStatus, string> = {
  novo: "Iniciar Preparo",
  em_preparo: "Levar ao Forno",
  no_forno: "Despachar",
  saiu_para_entrega: "Concluir Entrega",
  concluido: "Concluído",
  cancelado: "Cancelado",
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
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);

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

  const nextStatus = getNextFlowStatus(order.status);
  const NextIcon = nextStatus ? NEXT_STATUS_ICON[order.status] : CheckCircle2;

  // Horário formatado
  const orderTimeFormatted = React.useMemo(() => {
    try {
      return new Date(order.created_at).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }, [order.created_at]);

  // Cores por tempo de espera
  const isDelayed = elapsedMinutes >= 40 && order.status !== "concluido" && order.status !== "cancelado";
  const isWarning = elapsedMinutes >= 20 && !isDelayed && order.status !== "concluido" && order.status !== "cancelado";

  const cleanPhone = order.customer.phone.replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/55${cleanPhone}`;

  return (
    <>
      <div
        className={`rounded-2xl border bg-pizza-charcoal-card p-4 space-y-3 shadow-md transition-all ${
          isDelayed
            ? "border-red-500/60 bg-red-950/20"
            : isWarning
            ? "border-pizza-gold/60 bg-amber-950/15"
            : "border-pizza-border hover:border-stone-600"
        }`}
      >
        {/* Top Header: ID, Modalidade, Horário e Tempo */}
        <div className="flex items-start justify-between gap-2 border-b border-white/5 pb-2.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-serif font-black text-pizza-gold text-base tracking-wide">
                {order.display_id}
              </span>
              <Badge
                variant={order.delivery_type === "delivery" ? "terracotta" : "outline"}
                className="text-[10px] uppercase font-bold py-0.5"
              >
                {order.delivery_type === "delivery" ? "Delivery" : "Retirada"}
              </Badge>
              {orderTimeFormatted && (
                <span className="text-[11px] text-stone-400 font-semibold">
                  às {orderTimeFormatted}
                </span>
              )}
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
            title={`Pedido recebido às ${orderTimeFormatted} (${elapsedMinutes}m atrás)`}
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
            <p className="flex items-start gap-1 text-stone-300 text-[11px] leading-tight">
              <MapPin className="w-3 h-3 text-pizza-terracotta shrink-0 mt-0.5" />
              <span className="line-clamp-2">
                {order.address.street}, {order.address.number}
                {order.address.complement ? ` (${order.address.complement})` : ""} - {order.address.neighborhood}
                {order.address.reference ? ` [Ref: ${order.address.reference}]` : ""}
              </span>
            </p>
          )}
        </div>

        {/* Itens do Pedido (Cozinha & Montagem) */}
        <div className="space-y-2.5 border-t border-b border-white/5 py-2">
          {order.items.map((item, idx) => (
            <div key={idx} className="space-y-1.5 text-xs bg-black/20 p-2 rounded-xl">
              <div className="flex justify-between font-bold text-pizza-cream">
                <span>
                  {item.quantity}x {item.name}
                </span>
                <span className="text-stone-400 font-normal">
                  {formatCurrency(item.total_price_cents)}
                </span>
              </div>

              {/* Sabores / Meio a Meio */}
              {item.flavors && item.flavors.length > 1 ? (
                <div className="text-[11px] text-pizza-gold font-medium pl-1">
                  ½ {item.flavors[0]?.name} + ½ {item.flavors[1]?.name}
                </div>
              ) : item.flavors && item.flavors.length === 1 && (
                <div className="text-[11px] text-stone-400 pl-1">
                  Sabor: {item.flavors[0]?.name}
                </div>
              )}

              {/* Borda Recheada */}
              {item.crust && (
                <div className="text-[11px] text-amber-300 font-medium pl-1">
                  Borda: {item.crust.name}
                </div>
              )}

              {/* DESTAQUE VISUAL INEQUÍVOCO PARA INGREDIENTES REMOVIDOS */}
              {item.removed_ingredients && item.removed_ingredients.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {item.removed_ingredients.map((ing, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-600 text-white text-[11px] font-black uppercase shadow-sm tracking-wider"
                    >
                      <AlertTriangle className="w-3 h-3 text-yellow-300 shrink-0" />
                      <span>SEM {ing}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Adicionais */}
              {item.extras && item.extras.length > 0 && (
                <div className="text-[11px] text-emerald-400 pl-1">
                  + Extras: {item.extras.map((e) => e.name).join(", ")}
                </div>
              )}

              {/* Observações */}
              {item.notes && (
                <div className="text-[11px] text-amber-200 bg-amber-950/40 border border-amber-500/30 p-1.5 rounded-lg">
                  <span className="font-bold">Obs:</span> &quot;{item.notes}&quot;
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Rodapé Financeiro Transparente: Subtotal, Taxa, Total e Pagamento */}
        <div className="space-y-1 text-xs pt-1">
          <div className="flex justify-between text-[11px] text-stone-400">
            <span>Subtotal: {formatCurrency(order.subtotal_cents)}</span>
            <span>
              Taxa: {order.delivery_fee_cents > 0 ? formatCurrency(order.delivery_fee_cents) : "Grátis"}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-1.5">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase text-stone-400 font-semibold">Total Geral</span>
              <p className="font-bold text-base text-pizza-gold">
                {formatCurrency(order.total_cents)}
              </p>
            </div>

            <div className="text-right">
              <Badge variant="outline" className="text-[10px] uppercase font-bold">
                {order.payment_method === "pix"
                  ? "PIX"
                  : order.payment_method === "cartao"
                  ? "Cartão"
                  : `Dinheiro${order.change_for_cents ? ` (Troco p/ ${formatCurrency(order.change_for_cents)})` : ""}`}
              </Badge>
            </div>
          </div>
        </div>

        {/* Ações de Controle Operacional */}
        <div className="pt-2 flex items-center gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsDetailsOpen(true)}
            className="px-2 py-1 h-8 text-xs text-stone-300 hover:text-white"
            title="Ver comanda completa do pedido"
          >
            <ReceiptText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline ml-1">Comanda</span>
          </Button>

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
              className="px-2 py-1 h-8 text-stone-500 hover:text-red-400 hover:bg-red-950/30"
              title="Cancelar pedido"
            >
              <XCircle className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Modal de Comanda Completa / Detalhes Sem Ambiguidade */}
      <Dialog
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={`Comanda Completa — ${order.display_id}`}
        description="Ficha detalhada para montagem na cozinha, conferência e entrega."
      >
        <div className="space-y-4 text-xs mt-2">
          {/* Dados Gerais */}
          <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-black/30 border border-white/5">
            <div>
              <p className="text-stone-400 text-[10px] uppercase font-bold">Cliente</p>
              <p className="font-bold text-pizza-cream">{order.customer.name}</p>
              <p className="text-stone-300">{order.customer.phone}</p>
            </div>
            <div>
              <p className="text-stone-400 text-[10px] uppercase font-bold">Horário & Modalidade</p>
              <p className="font-bold text-pizza-cream">
                {orderTimeFormatted} ({elapsedMinutes} min decorridos)
              </p>
              <p className="capitalize text-pizza-gold font-bold">{order.delivery_type}</p>
            </div>
          </div>

          {/* Endereço Completo */}
          {order.address && (
            <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1">
              <p className="text-stone-400 text-[10px] uppercase font-bold">Endereço de Entrega</p>
              <p className="font-bold text-pizza-cream">
                {order.address.street}, {order.address.number}
                {order.address.complement ? ` — ${order.address.complement}` : ""}
              </p>
              <p className="text-stone-300">
                Bairro: {order.address.neighborhood} | CEP: {order.address.postal_code}
              </p>
              {order.address.reference && (
                <p className="text-amber-300 italic">Ponto de Ref: {order.address.reference}</p>
              )}
            </div>
          )}

          {/* Itens */}
          <div className="space-y-2">
            <p className="text-stone-400 text-[10px] uppercase font-bold">Itens da Comanda</p>
            {order.items.map((item, i) => (
              <div key={i} className="p-3 rounded-xl bg-pizza-charcoal border border-pizza-border space-y-1.5">
                <div className="flex justify-between font-bold text-sm text-pizza-cream">
                  <span>{item.quantity}x {item.name}</span>
                  <span>{formatCurrency(item.total_price_cents)}</span>
                </div>

                {item.flavors && item.flavors.length > 1 && (
                  <p className="text-pizza-gold font-semibold">
                    Divisão: ½ {item.flavors[0]?.name} / ½ {item.flavors[1]?.name}
                  </p>
                )}

                {item.crust && (
                  <p className="text-amber-300">Borda recheada: {item.crust.name}</p>
                )}

                {item.extras && item.extras.length > 0 && (
                  <p className="text-emerald-400">
                    Adicionais: {item.extras.map((e) => e.name).join(", ")}
                  </p>
                )}

                {item.removed_ingredients && item.removed_ingredients.length > 0 && (
                  <div className="p-2 rounded-lg bg-red-950/60 border border-red-500/60 space-y-1">
                    <p className="text-[10px] uppercase font-black text-red-300 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-yellow-300" />
                      <span>Atenção Equipe de Montagem:</span>
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {item.removed_ingredients.map((ing, k) => (
                        <span key={k} className="px-2 py-0.5 rounded bg-red-600 text-white font-black text-xs">
                          SEM {ing.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {item.notes && (
                  <p className="p-2 rounded-lg bg-amber-950/30 border border-amber-500/20 text-amber-200 italic">
                    Instrução: &quot;{item.notes}&quot;
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Fechamento Financeiro */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1 text-xs">
            <div className="flex justify-between text-stone-400">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal_cents)}</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Taxa de Entrega:</span>
              <span>{formatCurrency(order.delivery_fee_cents)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-pizza-gold border-t border-white/10 pt-1">
              <span>Total do Pedido:</span>
              <span>{formatCurrency(order.total_cents)}</span>
            </div>
            <div className="flex justify-between text-stone-300 pt-1 text-[11px]">
              <span>Forma de Pagamento:</span>
              <span className="uppercase font-bold">
                {order.payment_method}
                {order.change_for_cents ? ` (Troco para ${formatCurrency(order.change_for_cents)})` : ""}
              </span>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
