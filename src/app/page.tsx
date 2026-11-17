"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { StoreStatusBar } from "@/components/layout/StoreStatusBar";
import { Header } from "@/components/layout/Header";
import { HeroBanner } from "@/components/layout/HeroBanner";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { CatalogSection } from "@/components/catalog/CatalogSection";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Badge } from "@/components/ui/Badge";
import { useCartStore } from "@/store/cartStore";
import {
  MOCK_STORE_SETTINGS,
  MOCK_CATEGORIES,
  MOCK_PRODUCTS,
  MOCK_DELIVERY_ZONES,
} from "@/lib/mockData";
import type {
  Product,
  Category,
  OrderItem,
  StoreSettings,
  DeliveryZone,
} from "@/types/domain";
import { calculateItemPrice } from "@/domain/pricing";
import { formatCentsToBRL } from "@/domain/currency";
import { getStoreOperationalStatus } from "@/domain/storeHours";
import { createClient } from "@/lib/supabase/client";
import { subscribeRealtimeSync } from "@/lib/realtimeBroadcast";
import {
  Flame,
  Wheat,
  Timer,
  MapPin,
  Phone,
  Bike,
  Clock,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";

const PizzaBuilderModal = dynamic(
  () => import("@/components/builder/PizzaBuilderModal").then((mod) => mod.PizzaBuilderModal),
  { ssr: false }
);

const CheckoutModal = dynamic(
  () => import("@/components/checkout/CheckoutModal").then((mod) => mod.CheckoutModal),
  { ssr: false }
);

function MainAppContent() {
  const { showToast } = useToast();
  const [products, setProducts] = React.useState<Product[]>(MOCK_PRODUCTS);
  const [categories, setCategories] = React.useState<Category[]>(MOCK_CATEGORIES);
  const [storeSettings, setStoreSettings] = React.useState<StoreSettings>(MOCK_STORE_SETTINGS);
  const [deliveryZones, setDeliveryZones] = React.useState<DeliveryZone[]>(MOCK_DELIVERY_ZONES);

  const [builderProduct, setBuilderProduct] = React.useState<Product | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = React.useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);

  // Zustand Store Hooks
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const setHalfAndHalfRule = useCartStore((s) => s.setHalfAndHalfRule);
  const totalItemsCount = useCartStore((s) => s.getTotalItemsCount());

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Sincroniza catálogo vivo a partir do backend (/api/products)
  const syncProducts = React.useCallback(async () => {
    try {
      const res = await fetch("/api/products", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        setProducts(data.products);
      }
      if (data.success && Array.isArray(data.categories)) {
        setCategories(data.categories);
      }
    } catch {
      // Falha silenciosa em caso de oscilação; próximo ciclo resincroniza
    }
  }, []);

  // Sincroniza status operacional, regra meio a meio e zonas de entrega (/api/store/status)
  const syncStoreStatus = React.useCallback(async () => {
    try {
      const res = await fetch("/api/store/status", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.settings) {
        setStoreSettings(data.settings);
        setHalfAndHalfRule(data.settings.half_and_half_pricing_rule);
      }
      if (data.success && Array.isArray(data.deliveryZones)) {
        setDeliveryZones(data.deliveryZones);
      }
    } catch {
      // Falha silenciosa em caso de oscilação
    }
  }, [setHalfAndHalfRule]);

  const syncAllStoreData = React.useCallback(() => {
    void syncProducts();
    void syncStoreStatus();
  }, [syncProducts, syncStoreStatus]);

  // 1. Hidratação inicial + Polling de segurança (4s) + Visibilidade da aba
  React.useEffect(() => {
    syncAllStoreData();

    const interval = setInterval(syncAllStoreData, 4000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncAllStoreData();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [syncAllStoreData]);

  // 2. Barramento multi-abas BroadcastChannel (<10ms entre Admin e Loja no mesmo navegador)
  React.useEffect(() => {
    return subscribeRealtimeSync(["products", "store_settings"], (ev) => {
      if (ev.topic === "products") {
        void syncProducts();
      } else if (ev.topic === "store_settings") {
        void syncStoreStatus();
      }
    });
  }, [syncProducts, syncStoreStatus]);

  // 3. Supabase Realtime para refletir mudanças entre dispositivos distintos
  React.useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("public-storefront-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          void syncProducts();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "store_settings" },
        () => {
          void syncStoreStatus();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "delivery_zones" },
        () => {
          void syncStoreStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [syncProducts, syncStoreStatus]);

  const operationalStatus = React.useMemo(() => {
    return getStoreOperationalStatus(storeSettings, new Date());
  }, [storeSettings]);

  const isStoreOpenHydrationSafe = mounted
    ? operationalStatus.isOpen
    : storeSettings.manual_override !== "fechado";

  const pizzasList = React.useMemo(() => {
    return products.filter((p) => p.flags.is_pizza);
  }, [products]);

  const handleCustomizePizza = React.useCallback((product: Product) => {
    setBuilderProduct(product);
    setIsBuilderOpen(true);
  }, []);

  const handleAddRegularItem = React.useCallback(
    (product: Product) => {
      const priceCents = product.sizes[0]?.price_cents || 0;
      const priceResult = calculateItemPrice({
        isPizza: false,
        basePriceCents: priceCents,
        quantity: 1,
      });

      const orderItem: OrderItem = {
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

      addItem(orderItem);
      showToast(`${product.name} adicionado ao carrinho!`, "success");
    },
    [addItem, showToast]
  );

  const handleScrollToHours = React.useCallback(() => {
    const el = document.getElementById("contato");
    el?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const whatsappDirectUrl = `https://wa.me/${storeSettings.whatsapp_number.replace(/\D/g, "")}`;

  return (
    <div className="min-h-screen flex flex-col bg-pizza-charcoal text-pizza-cream">
      {/* 1. Barra Superior de Status Operacional da Loja */}
      <StoreStatusBar settings={storeSettings} />

      {/* Aviso Claro quando a Loja Estiver Fechada */}
      {mounted && !operationalStatus.isOpen && (
        <div
          role="status"
          className="w-full bg-red-950/60 border-b border-red-500/40 px-4 py-2.5 text-center text-xs text-red-200 flex items-center justify-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            No momento nosso forno está fechado ({operationalStatus.reason}). Você pode explorar o cardápio normalmente.
          </span>
        </div>
      )}

      {/* 2. Header Responsivo */}
      <Header
        cartItemCount={mounted ? totalItemsCount : 0}
        onOpenCart={openCart}
      />

      {/* 3. Hero Banner Gastronômico */}
      <HeroBanner settings={storeSettings} isStoreOpen={isStoreOpenHydrationSafe} />

      {/* 4. Catálogo de Produtos + Tradição + Zonas de Entrega */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-20">
        <CatalogSection
          products={products}
          categories={categories}
          onCustomizePizza={handleCustomizePizza}
          onAddRegularItem={handleAddRegularItem}
        />

        {/* Seção #sobre — Nossa Tradição */}
        <section
          id="sobre"
          className="scroll-mt-24 rounded-3xl bg-pizza-charcoal-card border border-pizza-border p-6 sm:p-10 space-y-8 text-left"
        >
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-pizza-cream font-display tracking-tight">
              Nossa Tradição no Forno a Lenha
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Cada disco nasce de um processo artesanal lento que respeita o tempo da fermentação, a pureza dos insumos italianos e o calor vivo da madeira de eucalipto tratado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-pizza-charcoal border border-pizza-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-pizza-gold/15 border border-pizza-gold/30 flex items-center justify-center text-pizza-gold">
                <Timer className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-pizza-cream font-display">
                Fermentação Lenta de 48h
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Baixíssima carga de fermento biológico e maturação controlada a frio para uma massa incrivelmente leve, aerada e de fácil digestão.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-pizza-charcoal border border-pizza-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-pizza-terracotta/15 border border-pizza-terracotta/30 flex items-center justify-center text-pizza-terracotta">
                <Wheat className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-pizza-cream font-display">
                Farinha Tipo 00 &amp; Pelati DOP
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Farinha italiana moída a pedra combinada com molho de tomates San Marzano amassados manualmente e azeite extravirgem.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-pizza-charcoal border border-pizza-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-pizza-cream font-display">
                Lastro Vulcânico a 450°C
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Assamento relâmpago em 90 segundos que sela a umidade do molho e cria bordas alveoladas e tostadas na medida certa.
              </p>
            </div>
          </div>
        </section>

        {/* Seção #contato — Zonas de Entrega por Bairro & Atendimento */}
        <section
          id="contato"
          className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-12 gap-6 text-left"
        >
          {/* Tabela Viva de Zonas de Entrega */}
          <div className="lg:col-span-7 rounded-3xl bg-pizza-charcoal-card border border-pizza-border p-6 sm:p-8 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-pizza-cream font-display">
                  Taxas e Prazos por Bairro
                </h2>
                <p className="text-xs text-stone-400 mt-1">
                  Valores calculados automaticamente conforme sua localização no checkout.
                </p>
              </div>
              <Badge variant="terracotta" className="gap-1">
                <Bike className="w-3.5 h-3.5" />
                <span>Entrega Própria</span>
              </Badge>
            </div>

            <div className="divide-y divide-white/5 border border-pizza-border rounded-2xl bg-pizza-charcoal overflow-hidden">
              {deliveryZones
                .filter((z) => z.active)
                .map((zone) => (
                  <div
                    key={zone.id}
                    className="px-4 py-3 flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-pizza-terracotta shrink-0" />
                      <span className="font-semibold text-pizza-cream">{zone.neighborhood}</span>
                    </div>
                    <div className="flex items-center gap-4 tabular-nums">
                      <span className="text-stone-400 inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-pizza-gold" />
                        <span>~{zone.estimated_time_minutes} min</span>
                      </span>
                      <span className="font-bold text-pizza-gold min-w-[70px] text-right">
                        {formatCentsToBRL(zone.fee_cents)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Card de Contato e Retirada */}
          <div className="lg:col-span-5 rounded-3xl bg-pizza-charcoal-card border border-pizza-border p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-black text-pizza-cream font-display">
                Fale Conosco &amp; Retirada
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                Prefere retirar direto no balcão sem taxa de entrega ou tirar dúvidas sobre ingredientes e pedidos para eventos?
              </p>

              <div className="space-y-3 pt-2 text-xs">
                <div className="p-3.5 rounded-2xl bg-pizza-charcoal border border-pizza-border flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-pizza-terracotta shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-pizza-cream">Endereço da Forneria</p>
                    <p className="text-stone-400 mt-0.5">
                      Rua das Pizzas Artesanais, 1000 — Vila Gastronômica, São Paulo - SP
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-pizza-charcoal border border-pizza-border flex items-start gap-3">
                  <Phone className="w-4 h-4 text-pizza-gold shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-pizza-cream">Atendimento Direto</p>
                    <p className="text-stone-400 mt-0.5 tabular-nums">
                      WhatsApp Oficial: {storeSettings.whatsapp_number}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <a
              href={whatsappDirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-3 rounded-xl bg-pizza-gold text-pizza-charcoal font-bold text-xs hover:bg-amber-400 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chamar no WhatsApp da Pizzaria</span>
            </a>
          </div>
        </section>
      </main>

      {/* 5. Footer Institucional */}
      <Footer />

      {/* 6. Barra de Navegação Inferior Móvel (< md) */}
      <BottomNav
        activeTab="cardapio"
        cartItemCount={mounted ? totalItemsCount : 0}
        onOpenCart={openCart}
        onOpenHours={handleScrollToHours}
      />

      {/* 7. Modal Construtor de Pizza */}
      <PizzaBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => {
          setIsBuilderOpen(false);
          setBuilderProduct(null);
        }}
        initialProduct={builderProduct}
        allPizzas={pizzasList}
      />

      {/* 8. Drawer do Carrinho Conectado */}
      <CartDrawer onOpenCheckout={() => setIsCheckoutOpen(true)} />

      {/* 9. Modal de Checkout Completo */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        deliveryZones={deliveryZones}
        settings={storeSettings}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <ToastProvider>
      <MainAppContent />
    </ToastProvider>
  );
}
