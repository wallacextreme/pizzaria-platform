"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAdminAuthStore } from "@/store/adminAuthStore";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { MetricsCards } from "@/components/admin/MetricsCards";
import { KanbanBoard } from "@/components/admin/KanbanBoard";
import { ProductManagement } from "@/components/admin/ProductManagement";
import type { Order, OrderStatus, StoreManualOverride } from "@/types/domain";
import { MOCK_PRODUCTS } from "@/lib/mockData";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Loader2, Sparkles } from "lucide-react";

import { audioNotifier } from "@/lib/audioNotifier";

// Pedidos demonstrativos iniciais para a cozinha
const INITIAL_DEMO_ORDERS: Order[] = [
  {
    id: "ord-demo-1",
    display_id: "#PZ-7841",
    status: "novo",
    customer: { name: "Lucas Almeida", phone: "(11) 98765-4321" },
    delivery_type: "delivery",
    address: {
      street: "Rua das Laranjeiras",
      number: "142",
      neighborhood: "Vila Gastronômica",
      city: "São Paulo",
      state: "SP",
      postal_code: "01310-100",
      reference: "Apto 42",
    },
    items: [
      {
        id: "item-1",
        product_id: "prod-1",
        name: "Pizza Margherita Especial (Grande)",
        is_pizza: true,
        flavors: [{ product_id: "prod-1", name: "Margherita Especial", price_cents: 7200 }],
        crust: { id: "crust-catupiry", name: "Catupiry Original", price_cents: 1200 },
        extras: [],
        removed_ingredients: ["manjericão"],
        notes: "Por favor cortar à francesa",
        unit_price_cents: 8400,
        quantity: 1,
        total_price_cents: 8400,
      },
      {
        id: "item-2",
        product_id: "prod-coca",
        name: "Coca-Cola 2L Gelada",
        is_pizza: false,
        flavors: [],
        extras: [],
        removed_ingredients: [],
        unit_price_cents: 1400,
        quantity: 1,
        total_price_cents: 1400,
      },
    ],
    payment_method: "pix",
    delivery_fee_cents: 500,
    subtotal_cents: 9800,
    total_cents: 10300,
    fulfillment_channel: "web",
    created_at: new Date(Date.now() - 4 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 60000).toISOString(),
  },
  {
    id: "ord-demo-2",
    display_id: "#PZ-7840",
    status: "em_preparo",
    customer: { name: "Fernanda Costa", phone: "(11) 97123-8899" },
    delivery_type: "delivery",
    address: {
      street: "Av. Paulista",
      number: "1500",
      neighborhood: "Centro Histórico",
      city: "São Paulo",
      state: "SP",
      postal_code: "01311-200",
    },
    items: [
      {
        id: "item-3",
        product_id: "prod-2",
        name: "Pizza Calabresa Artesanal (Grande)",
        is_pizza: true,
        flavors: [
          { product_id: "prod-2", name: "Calabresa Artesanal", price_cents: 6800 },
          { product_id: "prod-3", name: "Quatro Queijos Nobres", price_cents: 7800 },
        ],
        crust: { id: "crust-cheddar", name: "Cheddar Cremoso", price_cents: 1200 },
        extras: [{ id: "extra-bacon", name: "Bacon Crocante", price_cents: 800 }],
        removed_ingredients: ["cebola"],
        notes: "Massa bem douradinha",
        unit_price_cents: 9800,
        quantity: 1,
        total_price_cents: 9800,
      },
    ],
    payment_method: "dinheiro",
    change_for_cents: 12000,
    delivery_fee_cents: 700,
    subtotal_cents: 9800,
    total_cents: 10500,
    fulfillment_channel: "whatsapp",
    created_at: new Date(Date.now() - 18 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 60000).toISOString(),
  },
  {
    id: "ord-demo-3",
    display_id: "#PZ-7839",
    status: "no_forno",
    customer: { name: "Roberto Silveira", phone: "(11) 99345-6789" },
    delivery_type: "retirada",
    items: [
      {
        id: "item-4",
        product_id: "prod-3",
        name: "Pizza Quatro Queijos Nobres (Média)",
        is_pizza: true,
        flavors: [{ product_id: "prod-3", name: "Quatro Queijos", price_cents: 6500 }],
        extras: [],
        removed_ingredients: [],
        unit_price_cents: 6500,
        quantity: 1,
        total_price_cents: 6500,
      },
    ],
    payment_method: "cartao",
    delivery_fee_cents: 0,
    subtotal_cents: 6500,
    total_cents: 6500,
    fulfillment_channel: "web",
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: "ord-demo-4",
    display_id: "#PZ-7838",
    status: "saiu_para_entrega",
    customer: { name: "Camila Rodrigues", phone: "(11) 98111-2233" },
    delivery_type: "delivery",
    address: {
      street: "Rua Augusta",
      number: "850",
      neighborhood: "Centro Histórico",
      city: "São Paulo",
      state: "SP",
      postal_code: "01305-100",
    },
    items: [
      {
        id: "item-5",
        product_id: "prod-1",
        name: "Pizza Margherita (Família)",
        is_pizza: true,
        flavors: [{ product_id: "prod-1", name: "Margherita", price_cents: 8600 }],
        extras: [],
        removed_ingredients: [],
        unit_price_cents: 8600,
        quantity: 1,
        total_price_cents: 8600,
      },
    ],
    payment_method: "pix",
    delivery_fee_cents: 700,
    subtotal_cents: 8600,
    total_cents: 9300,
    fulfillment_channel: "web",
    created_at: new Date(Date.now() - 35 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 60000).toISOString(),
  },
];

export default function AdminPage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAdminAuthStore();

  const [orders, setOrders] = React.useState<Order[]>(INITIAL_DEMO_ORDERS);
  const [activeTab, setActiveTab] = React.useState<"kanban" | "cardapio">("kanban");
  const [storeStatus, setStoreStatus] = React.useState<StoreManualOverride>("auto");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Route Guard seguro contra race conditions de hidratação
  React.useEffect(() => {
    if (isClient && _hasHydrated && !isAuthenticated) {
      router.push("/admin/login");
    }
  }, [isClient, _hasHydrated, isAuthenticated, router]);


  // Carrega pedidos da API
  const fetchOrders = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.orders) && data.orders.length > 0) {
        // Mescla com os demos para experiência completa se houver poucos
        setOrders((prev) => {
          const apiOrderIds = new Set(data.orders.map((o: Order) => o.id));
          const filteredPrev = prev.filter((o) => !apiOrderIds.has(o.id));
          return [...data.orders, ...filteredPrev];
        });
      }
    } catch {
      // Mantém estado local se a API estiver offline
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Polling a cada 10s
  React.useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Atualiza status do pedido
  const handleStatusChange = async (id: string, newStatus: OrderStatus) => {
    // Atualização otimista imediata na interface
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, status: newStatus, updated_at: new Date().toISOString() } : o
      )
    );

    try {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
    } catch {
      // Erro silencioso ou retry
    }
  };

  // Simula chegada de um novo pedido para teste ao vivo
  const handleSimulateNewOrder = () => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const newOrder: Order = {
      id: `ord-sim-${Date.now()}`,
      display_id: `#PZ-${randomId}`,
      status: "novo",
      customer: { name: "Cliente Teste Ao Vivo", phone: "(11) 99999-8888" },
      delivery_type: "delivery",
      address: {
        street: "Alameda dos Anjos",
        number: "500",
        neighborhood: "Vila Gastronômica",
        city: "São Paulo",
        state: "SP",
        postal_code: "01310-000",
      },
      items: [
        {
          id: `item-sim-${Date.now()}`,
          product_id: "prod-1",
          name: "Pizza Especial do Chefe (Grande)",
          is_pizza: true,
          flavors: [{ product_id: "prod-1", name: "Margherita", price_cents: 7500 }],
          extras: [],
          removed_ingredients: ["cebola"],
          notes: "Pedido teste para validação de áudio e Kanban",
          unit_price_cents: 7500,
          quantity: 1,
          total_price_cents: 7500,
        },
      ],
      payment_method: "pix",
      delivery_fee_cents: 500,
      subtotal_cents: 7500,
      total_cents: 8000,
      fulfillment_channel: "web",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setOrders((prev) => [newOrder, ...prev]);
    // Toca o sintetizador sonoro
    audioNotifier.playOrderAlert();
  };

  if (!isClient || !_hasHydrated || !isAuthenticated) {
    return (

      <div className="min-h-screen bg-pizza-charcoal text-pizza-cream flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 mx-auto text-pizza-terracotta animate-spin" />
          <p className="text-xs text-stone-400">Verificando credenciais de acesso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pizza-charcoal text-pizza-cream flex flex-col">
      <AdminHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        {/* Banner Operacional com Ações Rápidas */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-pizza-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="terracotta">Fase 5 — Painel & Kanban Realtime</Badge>
              <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
                ● Conexão Ativa
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
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simular Novo Pedido</span>
            </Button>
          </div>
        </div>

        {/* 1. Métricas do Turno */}
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
