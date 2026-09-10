"use client";

import * as React from "react";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { StoreStatusBar } from "@/components/layout/StoreStatusBar";
import { Header } from "@/components/layout/Header";
import { HeroBanner } from "@/components/layout/HeroBanner";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import dynamic from "next/dynamic";
import { CatalogSection } from "@/components/catalog/CatalogSection";
import { CartDrawer } from "@/components/cart/CartDrawer";

const PizzaBuilderModal = dynamic(
  () => import("@/components/builder/PizzaBuilderModal").then((mod) => mod.PizzaBuilderModal),
  { ssr: false }
);

const CheckoutModal = dynamic(
  () => import("@/components/checkout/CheckoutModal").then((mod) => mod.CheckoutModal),
  { ssr: false }
);
import { useCartStore } from "@/store/cartStore";
import { MOCK_STORE_SETTINGS, MOCK_CATEGORIES, MOCK_PRODUCTS } from "@/lib/mockData";
import type { Product, OrderItem } from "@/types/domain";
import { calculateItemPrice } from "@/domain/pricing";

function MainAppContent() {
  const { showToast } = useToast();
  const [builderProduct, setBuilderProduct] = React.useState<Product | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = React.useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);

  // Zustand Store Hooks
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const totalItemsCount = useCartStore((s) => s.getTotalItemsCount());

  // Evita Hydration Mismatch garantindo renderização controlada
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const pizzasList = React.useMemo(() => {
    return MOCK_PRODUCTS.filter((p) => p.flags.is_pizza);
  }, []);

  // Manipulador: Abrir Construtor de Pizza
  const handleCustomizePizza = React.useCallback((product: Product) => {
    setBuilderProduct(product);
    setIsBuilderOpen(true);
  }, []);

  // Manipulador: Adicionar Item Regular (Bebidas/Sobremesas)
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

  return (
    <div className="min-h-screen flex flex-col bg-pizza-charcoal text-pizza-cream">
      {/* 1. Barra Superior de Status Operacional da Loja */}
      <StoreStatusBar settings={MOCK_STORE_SETTINGS} />

      {/* 2. Header Responsivo */}
      <Header
        cartItemCount={mounted ? totalItemsCount : 0}
        onOpenCart={openCart}
      />

      {/* 3. Hero Banner Gastronômico */}
      <HeroBanner />

      {/* 4. Catálogo de Produtos com Abas, Busca e Cards */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
        <CatalogSection
          products={MOCK_PRODUCTS}
          categories={MOCK_CATEGORIES}
          onCustomizePizza={handleCustomizePizza}
          onAddRegularItem={handleAddRegularItem}
        />
      </main>

      {/* 5. Footer Institucional */}
      <Footer />

      {/* 6. Barra de Navegação Inferior Móvel (< md) */}
      <BottomNav
        activeTab="cardapio"
        cartItemCount={mounted ? totalItemsCount : 0}
        onOpenCart={openCart}
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
