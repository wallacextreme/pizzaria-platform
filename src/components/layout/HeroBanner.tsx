import * as React from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Flame, Clock, ShieldCheck, ArrowRight, Award } from "lucide-react";

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-pizza-charcoal via-pizza-charcoal-card to-pizza-charcoal border-b border-pizza-border py-12 sm:py-16 lg:py-20">
      {/* Decorative Warm Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-pizza-terracotta/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[400px] h-[250px] bg-pizza-gold/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Text Content */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-2">
              <Badge variant="terracotta" className="px-3 py-1 font-semibold">
                <Flame className="w-3.5 h-3.5 text-pizza-terracotta" />
                Forno a Lenha Artesanal
              </Badge>
              <Badge variant="warning" className="px-3 py-1 font-semibold">
                <Award className="w-3.5 h-3.5 text-pizza-gold" />
                Fermentação Lenta 48h
              </Badge>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-pizza-cream font-display tracking-tight leading-[1.1]">
              Pizzas de Verdade,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pizza-terracotta via-amber-400 to-pizza-gold">
                Sabor Inesquecível.
              </span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-stone-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Massa artesanal leve e crocante, molho de tomate pelati italiano e queijos selecionados. Escolha seus sabores favoritos ou monte sua pizza meio a meio.
            </p>

            {/* Value Props Pills */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-medium text-stone-300">
              <div className="flex items-center gap-1.5 bg-pizza-charcoal px-3 py-1.5 rounded-xl border border-pizza-border">
                <Clock className="w-4 h-4 text-pizza-gold" />
                <span>Média de 45 min no delivery</span>
              </div>
              <div className="flex items-center gap-1.5 bg-pizza-charcoal px-3 py-1.5 rounded-xl border border-pizza-border">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Embalagem térmica lacrada</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <a href="#cardapio" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto font-bold text-base gap-2">
                  <span>Conhecer o Cardápio</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </a>
              <a href="#sobre" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto text-base">
                  Nossa Tradição
                </Button>
              </a>
            </div>
          </div>

          {/* Gastronomic Visual Showcase / Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md bg-gradient-to-b from-pizza-charcoal-card to-pizza-charcoal border border-pizza-border rounded-3xl p-6 shadow-2xl shadow-black/40">
              {/* Artisanal Seal Badge */}
              <div className="flex items-center justify-between pb-4 border-b border-pizza-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-pizza-terracotta/20 flex items-center justify-center text-pizza-terracotta">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-pizza-cream uppercase tracking-wider">
                      Tradição Napolitana
                    </h2>
                    <p className="text-[10px] text-stone-400">Desde a massa até o fogo</p>
                  </div>
                </div>
                <Badge variant="success" dot pulse>
                  Forno Ativo
                </Badge>
              </div>

              {/* Culinary Showcase Details */}
              <div className="py-6 space-y-4 text-left">
                <div className="p-3.5 rounded-2xl bg-pizza-charcoal/80 border border-pizza-border flex items-start gap-3">
                  <span className="text-2xl select-none">🍕</span>
                  <div>
                    <h3 className="text-sm font-bold text-pizza-cream">
                      Opção Meio a Meio em Todas as Grandes
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Combine seus dois sabores preferidos com cálculo justo de preço.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-pizza-charcoal/80 border border-pizza-border flex items-start gap-3">
                  <span className="text-2xl select-none">🧀</span>
                  <div>
                    <h3 className="text-sm font-bold text-pizza-cream">
                      Bordas Vulcão & Catupiry Original
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Recheios fartos preparados na hora para valorizar cada fatia.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-pizza-charcoal/80 border border-pizza-border flex items-start gap-3">
                  <span className="text-2xl select-none">🛵</span>
                  <div>
                    <h3 className="text-sm font-bold text-pizza-cream">
                      Entrega Rápida ou Retirada no Balcão
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Acompanhe o status do seu pedido desde o forno até sua porta.
                    </p>
                  </div>
                </div>
              </div>

              {/* Micro-footer */}
              <div className="pt-3 border-t border-pizza-border text-center">
                <span className="text-xs text-pizza-gold font-semibold">
                  ★ 4.9 de avaliação média de mais de 2.400 clientes
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
