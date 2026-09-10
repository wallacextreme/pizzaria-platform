"use client";

import * as React from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { MetricsCards } from "@/components/admin/MetricsCards";
import { KanbanBoard } from "@/components/admin/KanbanBoard";
import { ProductManagement } from "@/components/admin/ProductManagement";
import type { Order, OrderStatus, StoreManualOverride } from "@/types/domain";
import { MOCK_PRODUCTS } from "@/lib/mockData";
import { reconcileOrders } from "@/domain/orderReconciliation";
import { createClient } from "@/lib/supabase/client";
import { audioNotifier } from "@/lib/audioNotifier";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Sparkles, AlertCircle } from "lucide-react";

export default function AdminPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [activeTab, setActiveTab] = React.useState<"kanban" | "cardapio">("kanban");
  const [storeStatus, setStoreStatus] = React.useState<StoreManualOverride>("auto");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = React.useState(false);

  // 1. Busca inicial e polling de fallback/resync a cada 10 segundos
  const fetchOrders = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.orders)) {
        setOrders((prev) => {
          const { orders: reconciled, hasNewIncomingOrder } = reconcileOrders(prev, data.orders);
          if (hasNewIncomingOrder && prev.length > 0) {
            audioNotifier.playOrderAlert();
          }
          return reconciled;
        });
      }
    } catch {
      // Falha de rede temporária: mantém estado local até o próximo polling
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Busca inicial do status da loja
  React.useEffect(() => {
    const fetchStoreStatus = async () => {
      try {
        const res = await fetch("/api/store/status");
        const data = await res.json();
        if (res.ok && data.success && data.manual_override) {
          setStoreStatus(data.manual_override);
        }
      } catch {
        // Fallback mantém 'auto'
      }
    };

    fetchStoreStatus();
    fetchOrders();
  }, [fetchOrders]);

  // 3. Supabase Realtime como mecanismo principal de baixa latência
  React.useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("admin-orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const incomingOrder = payload.new as Order;
            setOrders((prev) => {
              const { orders: reconciled, hasNewIncomingOrder } = reconcileOrders(prev, incomingOrder);
              if (hasNewIncomingOrder) {
                audioNotifier.playOrderAlert();
              }
              return reconciled;
            });
          }
        }
      )
      .subscribe((status) => {
        setRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 4. Fallback: Polling a cada 10s para reconciliação e resync em caso de oscilação
  React.useEffect(() => {
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // 5. Atualização controlada de status com validação no servidor
  const handleStatusChange = async (id: string, newStatus: OrderStatus) => {
    setErrorMessage(null);

    // Otimista inicial
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, status: newStatus, updated_at: new Date().toISOString() } : o
      )
    );

    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.order) {
        setOrders((prev) => reconcileOrders(prev, data.order).orders);
      } else {
        setErrorMessage(data.error || "Transição de status não autorizada pelo servidor.");
        // Reverte estado buscando a fonte da verdade do servidor
        fetchOrders();
      }
    } catch {
      setErrorMessage("Erro de comunicação ao atualizar status do pedido.");
      fetchOrders();
    }
  };

  // Simula chegada de um novo pedido persistindo via POST /api/orders
  const handleSimulateNewOrder = async () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newOrderPayload = {
      customer: { name: `Cliente Teste #${randomNum}`, phone: "(11) 99999-0000" },
      delivery_type: "delivery",
      address: {
        street: "Alameda dos Anjos",
        number: "500",
        neighborhood: "Vila Gastronômica",
        city: "São Paulo",
        state: "SP",
        postal_code: "01310-000",
        reference: "Portão lateral",
      },
      items: [
        {
          product_id: "prod-margherita",
          is_pizza: true,
          size_id: "size-grande",
          flavor_ids: ["prod-margherita"],
          crust_id: "crust-catupiry",
          extra_ids: [],
          removed_ingredients: ["manjericão"],
          notes: "Pedido teste para validação de áudio e Kanban",
          quantity: 1,
        },
      ],
      payment_method: "pix",
      fulfillment_channel: "web",
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrderPayload),
      });
      const data = await res.json();
      if (res.ok && data.success && data.order) {
        setOrders((prev) => {
          const { orders: reconciled } = reconcileOrders(prev, data.order);
          return reconciled;
        });
        audioNotifier.playOrderAlert();
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="min-h-screen bg-pizza-charcoal text-pizza-cream flex flex-col">
      <AdminHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        {/* Banner Operacional com Ações Rápidas */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-pizza-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="terracotta">Fase 5 — Painel & Kanban Realtime</Badge>
              <Badge
                variant="outline"
                className={
                  realtimeConnected
                    ? "text-emerald-400 border-emerald-500/30"
                    : "text-amber-400 border-amber-500/30"
                }
              >
                ● {realtimeConnected ? "Realtime Conectado" : "Polling Ativo (10s Fallback)"}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-pizza-cream mt-1">
              Controle Operacional da Cozinha
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleSimulateNewOrder}
              className="text-xs gap-1.5 font-bold h-9 bg-pizza-terracotta/10 border-pizza-terracotta/40 text-pizza-terracotta hover:bg-pizza-terracotta hover:text-white transition-all shadow-sm"
              title="Cria um pedido de teste real via POST /api/orders"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simular Novo Pedido</span>
            </Button>
          </div>
        </div>

        {/* Mensagem de Erro Operacional */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-red-950/50 border border-red-500/50 text-red-300 text-xs flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-white text-xs font-bold"
            >
              Fechar
            </button>
          </div>
        )}

        {/* 1. Métricas do Turno (Fonte Única de Verdade) */}
        <MetricsCards orders={orders} />

        {/* 2. Conteúdo da Aba Selecionada */}
        {activeTab === "kanban" ? (
          <KanbanBoard
            orders={orders}
            onStatusChange={handleStatusChange}
            onRefresh={fetchOrders}
            isLoading={isLoading}
          />
        ) : (
          <ProductManagement
            initialProducts={MOCK_PRODUCTS}
            storeStatus={storeStatus}
            onStoreStatusChange={setStoreStatus}
          />
        )}
      </main>
    </div>
  );
}
