"use client";

import * as React from "react";
import type { Order } from "@/types/domain";
import { formatCurrency } from "@/domain/currency";
import { Card, CardContent } from "@/components/ui/Card";
import { DollarSign, ShoppingBag, Flame, TrendingUp } from "lucide-react";

interface MetricsCardsProps {
  orders: Order[];
}

export function MetricsCards({ orders }: MetricsCardsProps) {
  const metrics = React.useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== "cancelado");
    const totalRevenueCents = validOrders.reduce((sum, o) => sum + o.total_cents, 0);
    const inKitchenCount = orders.filter((o) =>
      ["novo", "em_preparo", "no_forno"].includes(o.status)
    ).length;
    const averageTicketCents =
      validOrders.length > 0 ? Math.round(totalRevenueCents / validOrders.length) : 0;

    return {
      totalRevenueCents,
      ordersCount: orders.length,
      validOrdersCount: validOrders.length,
      inKitchenCount,
      averageTicketCents,
    };
  }, [orders]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Faturamento do Dia */}
      <Card className="bg-pizza-charcoal-card border-pizza-border p-4">
        <CardContent className="p-0 space-y-1">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[11px] uppercase font-bold tracking-wider">Faturamento Hoje</span>
            <div className="p-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-400">
            {formatCurrency(metrics.totalRevenueCents)}
          </p>
          <p className="text-[10px] text-stone-500">
            {metrics.validOrdersCount} pedidos faturados
          </p>
        </CardContent>
      </Card>

      {/* 2. Total de Pedidos */}
      <Card className="bg-pizza-charcoal-card border-pizza-border p-4">
        <CardContent className="p-0 space-y-1">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[11px] uppercase font-bold tracking-wider">Total Pedidos</span>
            <div className="p-1.5 rounded-lg bg-pizza-terracotta/20 text-pizza-terracotta border border-pizza-terracotta/30">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-pizza-cream">
            {metrics.ordersCount}
          </p>
          <p className="text-[10px] text-stone-500">
            Recebidos no turno de hoje
          </p>
        </CardContent>
      </Card>

      {/* 3. Em Produção na Cozinha */}
      <Card className="bg-pizza-charcoal-card border-pizza-border p-4">
        <CardContent className="p-0 space-y-1">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[11px] uppercase font-bold tracking-wider">Na Cozinha</span>
            <div className="p-1.5 rounded-lg bg-pizza-gold/20 text-pizza-gold border border-pizza-gold/30">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-pizza-gold">
            {metrics.inKitchenCount}
          </p>
          <p className="text-[10px] text-stone-500">
            Novos, preparando ou no forno
          </p>
        </CardContent>
      </Card>

      {/* 4. Ticket Médio */}
      <Card className="bg-pizza-charcoal-card border-pizza-border p-4">
        <CardContent className="p-0 space-y-1">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[11px] uppercase font-bold tracking-wider">Ticket Médio</span>
            <div className="p-1.5 rounded-lg bg-sky-950/40 text-sky-400 border border-sky-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-sky-400">
            {formatCurrency(metrics.averageTicketCents)}
          </p>
          <p className="text-[10px] text-stone-500">
            Média por pedido concluído
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
