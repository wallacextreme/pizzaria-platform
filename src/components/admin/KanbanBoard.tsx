"use client";

import * as React from "react";
import type { Order, OrderStatus } from "@/types/domain";
import { OrderCard } from "./OrderCard";
import { audioNotifier } from "@/lib/audioNotifier";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Bell,
  ChefHat,
  Flame,
  Bike,
  CheckCircle2,
  RefreshCw,
  Clock,
} from "lucide-react";


interface ColumnDef {
  status: OrderStatus;
  title: string;
  icon: React.ElementType;
  colorClass: string;
  badgeVariant: "terracotta" | "warning" | "default" | "outline" | "success";
}

const KANBAN_COLUMNS: ColumnDef[] = [
  {
    status: "novo",
    title: "Novos Pedidos",
    icon: Bell,
    colorClass: "border-pizza-terracotta text-pizza-terracotta",
    badgeVariant: "terracotta",
  },
  {
    status: "em_preparo",
    title: "Em Preparo",
    icon: ChefHat,
    colorClass: "border-pizza-gold text-pizza-gold",
    badgeVariant: "warning",
  },
  {
    status: "no_forno",
    title: "No Forno",
    icon: Flame,
    colorClass: "border-amber-600 text-amber-500",
    badgeVariant: "default",
  },

  {
    status: "saiu_para_entrega",
    title: "A Caminho / Despachado",
    icon: Bike,
    colorClass: "border-sky-500 text-sky-400",
    badgeVariant: "outline",
  },
  {
    status: "concluido",
    title: "Concluídos",
    icon: CheckCircle2,
    colorClass: "border-emerald-500 text-emerald-400",
    badgeVariant: "success",
  },
];

interface KanbanBoardProps {
  orders: Order[];
  onStatusChange: (id: string, newStatus: OrderStatus) => Promise<void>;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function KanbanBoard({
  orders,
  onStatusChange,
  onRefresh,
  isLoading,
}: KanbanBoardProps) {
  const previousOrderIdsRef = React.useRef<Set<string>>(new Set());

  // Detecta chegada de novos pedidos e emite alerta sonoro via Web Audio API
  React.useEffect(() => {
    if (!orders.length) return;

    const currentOrderIds = new Set(orders.map((o) => o.id));

    // Se já havia pedidos carregados e entrou algum novo pedido com status 'novo'
    if (previousOrderIdsRef.current.size > 0) {
      const hasNewIncoming = orders.some(
        (o) => o.status === "novo" && !previousOrderIdsRef.current.has(o.id)
      );

      if (hasNewIncoming) {
        audioNotifier.playOrderAlert();
      }
    }

    previousOrderIdsRef.current = currentOrderIds;
  }, [orders]);

  // Agrupa pedidos por status
  const ordersByStatus = React.useMemo(() => {
    const map: Record<OrderStatus, Order[]> = {
      novo: [],
      em_preparo: [],
      no_forno: [],
      saiu_para_entrega: [],
      concluido: [],
      cancelado: [],
    };

    orders.forEach((o) => {
      if (map[o.status]) {
        map[o.status].push(o);
      }
    });

    return map;
  }, [orders]);

  return (
    <div className="space-y-4">
      {/* Barra de Ações do Kanban */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-pizza-cream">Quadro de Produção</span>
          <Badge variant="outline" className="text-xs">
            {orders.length} pedidos hoje
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={onRefresh}
            disabled={isLoading}
            className="text-xs gap-1.5 h-8"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Atualizar</span>
          </Button>
        </div>
      </div>

      {/* Grid de Colunas Kanban (Scroll horizontal suave se necessário) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => {
          const colOrders = ordersByStatus[col.status] || [];
          const Icon = col.icon;
          const isNovo = col.status === "novo";

          return (
            <div
              key={col.status}
              className="flex flex-col rounded-2xl bg-black/20 border border-pizza-border/70 p-3 min-w-[280px]"
            >
              {/* Cabeçalho da Coluna */}
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg bg-pizza-charcoal border ${col.colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs text-pizza-cream">
                    {col.title}
                  </span>
                </div>

                <Badge
                  variant={col.badgeVariant}
                  className={`text-[11px] font-bold px-2 py-0.5 ${
                    isNovo && colOrders.length > 0 ? "animate-pulse" : ""
                  }`}
                >
                  {colOrders.length}
                </Badge>
              </div>

              {/* Lista de Pedidos na Coluna */}
              <div className="flex-1 space-y-3 min-h-[300px]">
                {colOrders.length > 0 ? (
                  colOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onStatusChange={onStatusChange}
                    />
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-500 border border-dashed border-pizza-border/40 rounded-xl space-y-2">
                    <Clock className="w-6 h-6 stroke-1 text-stone-600" />
                    <p className="text-xs">Nenhum pedido nesta etapa</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
