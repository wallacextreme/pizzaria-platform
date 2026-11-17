"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { CatalogSection } from "@/components/catalog/CatalogSection";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { MetricsCards } from "@/components/admin/MetricsCards";
import { KanbanBoard } from "@/components/admin/KanbanBoard";
import { useCartStore } from "@/store/cartStore";
import { calculateItemPrice } from "@/domain/pricing";
import { formatCentsToBRL } from "@/domain/currency";
import {
  MOCK_CATEGORIES,
  MOCK_DELIVERY_ZONES,
  MOCK_PRODUCTS,
  MOCK_STORE_SETTINGS,
} from "@/lib/mockData";
import {
  getDemoOrderById,
  listDemoOrders,
  resetDemoSandbox,
  simulateRandomDemoOrder,
  transitionDemoOrderStatus,
} from "@/lib/demoSandboxStore";
import { subscribeRealtimeSync } from "@/lib/realtimeBroadcast";
import type { Order, OrderItem, OrderStatus, Product } from "@/types/domain";
import {
  ArrowLeft,
  Bell,
  Bike,
  CheckCircle2,
  ChefHat,
  Flame,
  Plus,
  RotateCcw,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Store,
} from "lucide-react";

const PizzaBuilderModal = dynamic(
  () => import("@/components/builder/PizzaBuilderModal").then((mod) => mod.PizzaBuilderModal),
  { ssr: false }
);

const CheckoutModal = dynamic(
  () => import("@/components/checkout/CheckoutModal").then((mod) => mod.CheckoutModal),
  { ssr: false }
);

type DemoTab = "cliente" | "cozinha" | "acompanhar";

const DEMO_STEPS: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: "novo", label: "Recebido", icon: Bell },
  { status: "em_preparo", label: "Em Preparo", icon: ChefHat },
  { status: "no_forno", label: "No Forno", icon: Flame },
  { status: "saiu_para_entrega", label: "A Caminho", icon: Bike },
  { status: "concluido", label: "Entregue", icon: CheckCircle2 },
];

function DemoContent() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const trackParam = searchParams.get("track");
  const tabParam = searchParams.get("tab") as DemoTab | null;

  const [activeTab, setActiveTab] = React.useState<DemoTab>(
    trackParam ? "acompanhar" : tabParam === "cozinha" || tabParam === "acompanhar" ? tabParam : "cozinha"
  );
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [trackedOrderId, setTrackedOrderId] = React.useState<string | null>(trackParam);

  const [builderProduct, setBuilderProduct] = React.useState<Product | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = React.useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const totalItemsCount = useCartStore((s) => s.getTotalItemsCount());

  const reloadOrders = React.useCallback(() => {
    const all = listDemoOrders();
    setOrders(all);
    setTrackedOrderId((prev) => {
      if (trackParam && all.some((o) => o.id === trackParam)) return trackParam;
      if (prev && all.some((o) => o.id === prev)) return prev;
      return all[0]?.id || null;
    });
  }, [trackParam]);

  React.useEffect(() => {
    reloadOrders();
    const unsub = subscribeRealtimeSync(["orders"], reloadOrders);
    return unsub;
  }, [reloadOrders]);

  const trackedOrder = React.useMemo(() => {
    if (!trackedOrderId) return orders[0] || null;
    return getDemoOrderById(trackedOrderId) || orders[0] || null;
  }, [trackedOrderId, orders]);

  const handleAddRegularItem = (product: Product) => {
    const priceCents = product.sizes?.[0]?.price_cents || 0;
    const priceResult = calculateItemPrice({
      isPizza: false,
      basePriceCents: priceCents,
      quantity: 1,
    });

    const newItem: OrderItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      product_id: product.id,
      name: product.name,
      is_pizza: false,
      flavors: [],
      extras: [],
      removed_ingredients: [],
      unit_price_cents: priceResult.unitPriceCents,
      quantity: 1,
      total_price_cents: priceResult.totalPriceCents,
    };

    addItem(newItem);
    showToast(`${product.name} adicionado ao carrinho!`);
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const updated = transitionDemoOrderStatus(orderId, newStatus);
      reloadOrders();
      showToast(`Pedido ${updated.display_id} movido no Kanban!`, "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao atualizar status", "error");
    }
  };

  const handleSimulateOrder = () => {
    const created = simulateRandomDemoOrder();
    reloadOrders();
    setTrackedOrderId(created.id);
    showToast(`Novo pedido demo ${created.display_id} entrou na cozinha!`, "success");
  };

  const handleResetDemo = () => {
    const fresh = resetDemoSandbox();
    setOrders(fresh);
    setTrackedOrderId(fresh[0]?.id || null);
    showToast("Sandbox restaurado para os 3 pedidos iniciais.", "info");
  };

  const currentStepIdx = trackedOrder
    ? Math.max(
        0,
        DEMO_STEPS.findIndex((s) => s.status === trackedOrder.status)
      )
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-pizza-charcoal text-pizza-cream">
      {/* Banner Técnico de Segurança para Recrutadores */}
      <div className="bg-amber-950/50 border-b border-amber-500/30 text-amber-200 px-4 py-2 text-xs text-center flex flex-wrap items-center justify-center gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong>Modo Demo Sandbox (Recrutadores):</strong> Simulação 100% local no navegador com dados fictícios.{" "}
          O painel administrativo real (<code className="text-amber-300">/admin</code>) mantém autenticação Supabase &amp; RBAC em produção.
        </span>
      </div>

      {/* Header Executivo do Sandbox */}
      <header className="sticky top-0 z-40 bg-pizza-charcoal-card/95 backdrop-blur-md border-b border-pizza-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-pizza-gold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Cardápio Principal</span>
              </Link>
              <span className="text-stone-600">|</span>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-pizza-terracotta" />
                <span className="font-display font-black text-base text-pizza-cream">
                  Forno &amp; Massa — Demo Live
                </span>
              </div>
            </div>

            <Button
              size="sm"
              variant="primary"
              onClick={openCart}
              className="lg:hidden gap-1.5"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{totalItemsCount}</span>
            </Button>
          </div>

          {/* Seletor Cliente / Cozinha / Rastreio + Ações */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-pizza-charcoal p-1 border border-pizza-border">
              <button
                type="button"
                onClick={() => setActiveTab("cliente")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "cliente"
                    ? "bg-pizza-terracotta text-white shadow"
                    : "text-stone-300 hover:text-white"
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>1. Visão Cliente</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("cozinha")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "cozinha"
                    ? "bg-pizza-terracotta text-white shadow"
                    : "text-stone-300 hover:text-white"
                }`}
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>2. Cozinha / Kanban ({orders.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("acompanhar")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "acompanhar"
                    ? "bg-pizza-terracotta text-white shadow"
                    : "text-stone-300 hover:text-white"
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                <span>3. Rastrear Pedido</span>
              </button>
            </div>

            <Button
              size="sm"
              variant="secondary"
              onClick={handleSimulateOrder}
              className="gap-1.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5 text-pizza-gold" />
              <span>+ Simular Pedido</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleResetDemo}
              className="gap-1.5 text-xs text-stone-400"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Resetar</span>
            </Button>

            <Button
              size="sm"
              variant="primary"
              onClick={openCart}
              className="hidden lg:inline-flex gap-1.5 text-xs"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Carrinho ({totalItemsCount})</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo Dinâmico */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "cliente" && (
          <div className="space-y-6">
            <div className="bg-pizza-charcoal-card border border-pizza-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="terracotta" className="text-[10px]">
                    <Sparkles className="w-3 h-3" />
                    <span>Passo 1 — Experiência do Cliente</span>
                  </Badge>
                </div>
                <p className="text-sm text-stone-300">
                  Monte uma pizza inteira ou meio a meio, adicione ao carrinho e finalize o pedido no checkout simulado.{" "}
                  Depois abra a aba <strong>2. Cozinha / Kanban</strong> para prepará-lo ao vivo.
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={openCart} className="shrink-0">
                Abrir Carrinho ({totalItemsCount})
              </Button>
            </div>

            <CatalogSection
              products={MOCK_PRODUCTS}
              categories={MOCK_CATEGORIES}
              onCustomizePizza={(p) => {
                setBuilderProduct(p);
                setIsBuilderOpen(true);
              }}
              onAddRegularItem={handleAddRegularItem}
            />
          </div>
        )}

        {activeTab === "cozinha" && (
          <div className="space-y-6">
            <MetricsCards orders={orders} />
            <KanbanBoard
              orders={orders}
              onStatusChange={handleStatusChange}
              onRefresh={reloadOrders}
            />
          </div>
        )}

        {activeTab === "acompanhar" && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Seletor rápido caso exista mais de 1 pedido */}
            {orders.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Pedidos no Sandbox:
                </span>
                {orders.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setTrackedOrderId(o.id)}
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                      trackedOrder?.id === o.id
                        ? "bg-pizza-terracotta border-pizza-terracotta text-white"
                        : "bg-pizza-charcoal-card border-pizza-border text-stone-300 hover:border-pizza-gold"
                    }`}
                  >
                    {o.display_id} ({o.customer.name.split(" ")[0]})
                  </button>
                ))}
              </div>
            )}

            {trackedOrder ? (
              <Card className="border-pizza-border bg-pizza-charcoal-card shadow-2xl">
                <CardContent className="p-6 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Badge variant="success" dot pulse className="mb-2">
                        Acompanhamento Ao Vivo (Sandbox)
                      </Badge>
                      <h2 className="text-2xl font-black font-display text-pizza-cream">
                        Pedido {trackedOrder.display_id}
                      </h2>
                      <p className="text-xs text-stone-400">
                        Cliente: <strong className="text-white">{trackedOrder.customer.name}</strong> •{" "}
                        {trackedOrder.delivery_type === "delivery" ? "Delivery" : "Retirada no Balcão"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setActiveTab("cozinha")}
                      className="gap-1.5"
                    >
                      <ChefHat className="w-4 h-4 text-pizza-gold" />
                      <span>Avançar Status na Cozinha</span>
                    </Button>
                  </div>

                  {/* Stepper Visual */}
                  <div className="grid grid-cols-5 gap-2 pt-2">
                    {DEMO_STEPS.map((step, idx) => {
                      const Icon = step.icon;
                      const done = idx < currentStepIdx;
                      const current = idx === currentStepIdx;
                      return (
                        <div key={step.status} className="flex flex-col items-center gap-2 text-center">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                              current
                                ? "bg-pizza-terracotta border-pizza-terracotta text-white scale-110 shadow-lg shadow-pizza-terracotta/30"
                                : done
                                ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400"
                                : "bg-pizza-charcoal border-pizza-border text-stone-500"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <span
                            className={`text-[11px] font-bold ${
                              current ? "text-pizza-gold" : done ? "text-emerald-400" : "text-stone-500"
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Itens do Pedido */}
                  <div className="border-t border-pizza-border pt-4 space-y-2 text-xs">
                    {trackedOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-stone-300">
                        <span>
                          <strong>{item.quantity}x</strong> {item.name}
                        </span>
                        <span className="font-mono font-bold">
                          {formatCentsToBRL(item.total_price_cents)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t border-pizza-border text-sm font-black text-pizza-cream">
                      <span>Total</span>
                      <span className="text-pizza-gold">{formatCentsToBRL(trackedOrder.total_cents)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-sm text-stone-400">
                  Nenhum pedido no sandbox. Clique em <strong>+ Simular Pedido</strong> acima.
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      <CartDrawer onOpenCheckout={() => setIsCheckoutOpen(true)} />

      <PizzaBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        initialProduct={builderProduct}
        allPizzas={MOCK_PRODUCTS.filter((p) => p.flags.is_pizza)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        deliveryZones={MOCK_DELIVERY_ZONES}
        settings={MOCK_STORE_SETTINGS}
        demoMode
        onOrderCreatedDemo={(order) => {
          reloadOrders();
          setTrackedOrderId(order.id);
          setActiveTab("acompanhar");
        }}
      />
    </div>
  );
}

export default function DemoPage() {
  return (
    <ToastProvider>
      <React.Suspense
        fallback={
          <div className="min-h-screen bg-pizza-charcoal text-pizza-cream flex items-center justify-center text-sm">
            Carregando Demo Sandbox...
          </div>
        }
      >
        <DemoContent />
      </React.Suspense>
    </ToastProvider>
  );
}
