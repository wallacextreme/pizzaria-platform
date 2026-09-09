"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Flame, ShoppingBag, Menu, Phone, Sparkles } from "lucide-react";

interface HeaderProps {
  cartItemCount?: number;
  onOpenCart?: () => void;
}

export function Header({ cartItemCount = 0, onOpenCart }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-pizza-charcoal/90 backdrop-blur-md border-b border-pizza-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Logo & Brand Identity */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pizza-terracotta rounded-xl p-1"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pizza-terracotta to-pizza-terracotta-dark flex items-center justify-center text-white shadow-lg shadow-pizza-terracotta/25 group-hover:scale-105 transition-transform">
              <Flame className="w-6 h-6 text-pizza-gold" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-pizza-cream font-display block leading-none">
                FORNO & MASSA
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-pizza-gold block mt-0.5">
                Pizzas Artesanais
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-300">
            <a
              href="#cardapio"
              className="hover:text-pizza-cream hover:text-white transition-colors"
            >
              Cardápio
            </a>
            <a
              href="#sobre"
              className="hover:text-pizza-cream hover:text-white transition-colors"
            >
              Nossa Tradição
            </a>
            <a
              href="#contato"
              className="hover:text-pizza-cream hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-pizza-terracotta" />
              <span>Contato</span>
            </a>
          </nav>

          {/* Actions: Cart + Mobile Menu */}
          <div className="flex items-center gap-3">
            {/* Cart Trigger */}
            <Button
              variant="primary"
              size="md"
              onClick={onOpenCart}
              className="relative px-4"
              aria-label={`Carrinho com ${cartItemCount} itens`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline font-bold">Carrinho</span>
              {cartItemCount > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-white text-pizza-charcoal text-[11px] font-black shadow-sm animate-in zoom-in">
                  {cartItemCount}
                </span>
              )}
            </Button>

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Abrir menu de navegação"
              className="md:hidden p-2 rounded-xl text-stone-300 hover:text-white hover:bg-white/5 border border-pizza-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pizza-terracotta"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <Drawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        title="Menu de Navegação"
        side="right"
      >
        <div className="flex flex-col gap-4 text-base font-semibold">
          <a
            href="#cardapio"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center justify-between p-3 rounded-xl bg-pizza-charcoal border border-pizza-border text-stone-200 hover:border-pizza-terracotta transition-colors"
          >
            <span>Cardápio Artesanal</span>
            <Sparkles className="w-4 h-4 text-pizza-gold" />
          </a>
          <a
            href="#sobre"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center justify-between p-3 rounded-xl bg-pizza-charcoal border border-pizza-border text-stone-200 hover:border-pizza-terracotta transition-colors"
          >
            <span>Nossa Tradição & Forno a Lenha</span>
          </a>
          <a
            href="#contato"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center justify-between p-3 rounded-xl bg-pizza-charcoal border border-pizza-border text-stone-200 hover:border-pizza-terracotta transition-colors"
          >
            <span>Falar Conosco</span>
            <Phone className="w-4 h-4 text-pizza-terracotta" />
          </a>
        </div>
      </Drawer>
    </>
  );
}
