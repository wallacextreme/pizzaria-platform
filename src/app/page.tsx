"use client";

import * as React from "react";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { StoreStatusBar } from "@/components/layout/StoreStatusBar";
import { Header } from "@/components/layout/Header";
import { HeroBanner } from "@/components/layout/HeroBanner";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Dialog } from "@/components/ui/Dialog";
import { Drawer } from "@/components/ui/Drawer";
import { PizzaCardSkeleton } from "@/components/ui/Skeleton";
import { MOCK_STORE_SETTINGS, MOCK_CATEGORIES } from "@/lib/mockData";
import { formatCentsToBRL } from "@/domain/currency";
import {
  Search,
  Sparkles,
  ShoppingBag,
  Flame,
  Layers,
  CheckCircle2,
} from "lucide-react";

function DesignSystemShowcaseContent() {
  const { showToast } = useToast();
  const [selectedCategory, setSelectedCategory] = React.useState(MOCK_CATEGORIES[0]?.id || "cat-pizzas-tradicionais");
  const [isDemoDialogOpen, setIsDemoDialogOpen] = React.useState(false);
  const [isDemoDrawerOpen, setIsDemoDrawerOpen] = React.useState(false);
  const [cartCount, setCartCount] = React.useState(0);

  const tabItems = React.useMemo(() => {
    return MOCK_CATEGORIES.map((cat, idx) => ({
      id: cat.id,
      label: cat.name,
      count: idx === 0 ? 8 : idx === 1 ? 6 : 4,
    }));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-pizza-charcoal text-pizza-cream">
      {/* 1. Barra Superior de Status Operacional da Loja */}
      <StoreStatusBar settings={MOCK_STORE_SETTINGS} />

      {/* 2. Header Responsivo */}
      <Header
        cartItemCount={cartCount}
        onOpenCart={() => {
          setIsDemoDrawerOpen(true);
          showToast("Painel lateral do carrinho aberto (Preview Fase 1)", "info");
        }}
      />

      {/* 3. Hero Banner Gastronômico */}
      <HeroBanner />

      {/* 4. Vitrine da Fundação & Design System */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
        {/* Bloco de Apresentação da Fase 1 */}
        <div className="p-6 sm:p-8 rounded-3xl bg-pizza-charcoal-card border border-pizza-border shadow-xl relative overflow-hidden">
          <div className="max-w-3xl space-y-4 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-pizza-basil/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Fase 1 — Foundation & Design System Gastronômico
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-pizza-cream font-display">
              Identidade Visual & Componentes Acessíveis
            </h2>
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
              Todos os tokens de design (Terracotta, Manjericão, Ouro Forno e Grafite Carvão) e componentes base foram centralizados e testados para máxima responsividade (360px a 1440px+) e acessibilidade semântica.
            </p>
          </div>
        </div>

        {/* Categoria Tabs Preview */}
        <section id="cardapio" className="space-y-4 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold font-display text-pizza-cream flex items-center gap-2">
                <Layers className="w-5 h-5 text-pizza-terracotta" />
                Navegação por Categorias
              </h3>
              <p className="text-xs text-stone-400">
                Tabs acessíveis com suporte a overflow móvel e contagem de itens.
              </p>
            </div>
            <div className="w-full sm:w-72">
              <Input
                placeholder="Pesquisar pizza ou ingrediente..."
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
          </div>

          <Tabs
            items={tabItems}
            activeTab={selectedCategory}
            onChange={(id) => {
              setSelectedCategory(id);
              showToast(`Categoria selecionada: ${MOCK_CATEGORIES.find((c) => c.id === id)?.name}`, "info");
            }}
          />
        </section>

        {/* Vitrine de Componentes UI: Buttons, Badges, Feedback */}
        <section className="space-y-6 text-left">
          <h3 className="text-xl font-bold font-display text-pizza-cream flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pizza-gold" />
            Tokens de Cores e Variantes de Botão
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Botões */}
            <Card>
              <CardHeader>
                <CardTitle>Botões & Ações</CardTitle>
                <CardDescription>Estados primary, secondary, outline, gold e loading.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="primary"
                    onClick={() => {
                      setCartCount((c) => c + 1);
                      showToast("Item demonstrativo adicionado!", "success");
                    }}
                  >
                    Primary (Terracotta)
                  </Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="gold">Gold Queijo</Button>
                  <Button variant="primary" isLoading>
                    Carregando
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Badges */}
            <Card>
              <CardHeader>
                <CardTitle>Badges & Status</CardTitle>
                <CardDescription>Indicadores visuais com suporte a pulso luminoso.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success" dot pulse>
                    Forno Aberto
                  </Badge>
                  <Badge variant="danger" dot>
                    Esgotado
                  </Badge>
                  <Badge variant="warning">
                    Mais Pedida
                  </Badge>
                  <Badge variant="terracotta">
                    Artesanal
                  </Badge>
                  <Badge variant="outline">
                    Sem Glúten
                  </Badge>
                </div>
                <p className="text-xs text-stone-400 pt-2 border-t border-pizza-border">
                  Exemplo monetário: Pizza Grande a partir de{" "}
                  <span className="text-pizza-gold font-bold">{formatCentsToBRL(7200)}</span>.
                </p>
              </CardContent>
            </Card>

            {/* Card 3: Overlays & Notificações */}
            <Card>
              <CardHeader>
                <CardTitle>Overlays & Toasts</CardTitle>
                <CardDescription>Modais, drawers e toasts acessíveis com auto-dismiss.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsDemoDialogOpen(true)}
                  >
                    Abrir Modal Dialog
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsDemoDrawerOpen(true)}
                  >
                    Abrir Drawer Lateral
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-pizza-border">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => showToast("Operação concluída com sucesso!", "success", "Sucesso")}
                  >
                    Toast Sucesso
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => showToast("Verifique os campos informados.", "error", "Falha")}
                  >
                    Toast Erro
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Vitrine de Skeletons / Loading States */}
        <section className="space-y-4 text-left">
          <div>
            <h3 className="text-xl font-bold font-display text-pizza-cream flex items-center gap-2">
              <Flame className="w-5 h-5 text-pizza-terracotta" />
              Skeletons & Estados de Carregamento
            </h3>
            <p className="text-xs text-stone-400">
              Shimmer animado sem layout shift enquanto os dados são carregados.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <PizzaCardSkeleton />
            <PizzaCardSkeleton />
            <PizzaCardSkeleton />
          </div>
        </section>
      </main>

      {/* 5. Footer */}
      <Footer />

      {/* 6. Barra de Navegação Móvel (Apenas < md) */}
      <BottomNav
        cartItemCount={cartCount}
        onOpenCart={() => setIsDemoDrawerOpen(true)}
        onOpenHours={() => setIsDemoDialogOpen(true)}
      />

      {/* Dialog Demonstrativo */}
      <Dialog
        isOpen={isDemoDialogOpen}
        onClose={() => setIsDemoDialogOpen(false)}
        title="Tradição de Fermentação Natural"
        description="Nossa massa passa por maturação lenta de 48 horas em temperatura controlada."
      >
        <div className="space-y-4 text-sm text-stone-300">
          <p>
            O processo de longa fermentação transforma os açúcares complexos da farinha, tornando a massa incrivelmente leve, de fácil digestão e com bordas alvéolos crocantes.
          </p>
          <div className="p-4 rounded-xl bg-pizza-charcoal border border-pizza-border space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-stone-400">Tempo de Maturação:</span>
              <span className="font-bold text-pizza-cream">48 Horas</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Farinha:</span>
              <span className="font-bold text-pizza-cream">Tipo 00 Italiana</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Hidratação:</span>
              <span className="font-bold text-pizza-cream">72%</span>
            </div>
          </div>
          <Button
            variant="primary"
            className="w-full"
            onClick={() => setIsDemoDialogOpen(false)}
          >
            Entendido
          </Button>
        </div>
      </Dialog>

      {/* Drawer Demonstrativo (Carrinho Mock) */}
      <Drawer
        isOpen={isDemoDrawerOpen}
        onClose={() => setIsDemoDrawerOpen(false)}
        title="Seu Carrinho (Preview da Fundação)"
        description="Na Fase 2, aqui será integrado o construtor e a persistência Zustand."
      >
        <div className="space-y-6 text-sm text-left">
          {cartCount === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-pizza-charcoal flex items-center justify-center text-stone-500 border border-pizza-border">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-pizza-cream">Seu carrinho está vazio</h4>
              <p className="text-xs text-stone-400 max-w-xs mx-auto">
                Adicione itens para visualizar o subtotal calculado em centavos inteiros.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setCartCount(1);
                  showToast("Item adicionado ao carrinho!", "success");
                }}
              >
                Adicionar Item Demonstração
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-pizza-charcoal border border-pizza-border space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-pizza-cream text-sm">
                      1x Pizza Margherita Especial (Grande)
                    </h5>
                    <p className="text-xs text-stone-400">Borda Catupiry Original</p>
                  </div>
                  <span className="font-bold text-pizza-gold text-sm">
                    {formatCentsToBRL(8400)}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-pizza-charcoal border border-pizza-border space-y-2 text-xs">
                <div className="flex justify-between text-stone-400">
                  <span>Subtotal</span>
                  <span className="text-pizza-cream">{formatCentsToBRL(8400)}</span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span>Taxa de Entrega</span>
                  <span className="text-pizza-cream">Calculada no checkout</span>
                </div>
                <div className="pt-2 border-t border-pizza-border flex justify-between font-bold text-sm text-pizza-cream">
                  <span>Total Estimado</span>
                  <span className="text-pizza-gold">{formatCentsToBRL(8400)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  variant="primary"
                  className="w-full font-bold"
                  onClick={() => {
                    showToast("Checkout será implementado na Fase 3", "info");
                  }}
                >
                  Prosseguir para o Checkout
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-xs text-stone-400"
                  onClick={() => setCartCount(0)}
                >
                  Limpar Carrinho
                </Button>
              </div>
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}

export default function HomePage() {
  return (
    <ToastProvider>
      <DesignSystemShowcaseContent />
    </ToastProvider>
  );
}
