import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { withBasePath } from "@/lib/assetPath";
import type { StoreSettings } from "@/types/domain";
import {
  Flame,
  Clock,
  ShieldCheck,
  ArrowRight,
  Award,
  Pizza,
  Layers,
  Bike,
  Star,
} from "lucide-react";

interface HeroBannerProps {
  settings?: StoreSettings;
  isStoreOpen?: boolean;
}

export function HeroBanner({ settings, isStoreOpen = true }: HeroBannerProps) {
  const avgDeliveryMin = settings?.delivery_settings?.default_estimated_time_min ?? 45;
  const halfRuleText =
    settings?.half_and_half_pricing_rule === "media_ponderada"
      ? "Cobrança pela média proporcional entre os dois sabores."
      : "Combine dois sabores com cálculo transparente pelo maior valor.";

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-pizza-charcoal via-pizza-charcoal-card to-pizza-charcoal border-b border-pizza-border py-10 sm:py-16 lg:py-20">
      {/* Iluminação ambiente sutil de forno a lenha */}
      <div className="absolute -top-24 left-1/3 w-[560px] h-[320px] bg-pizza-terracotta/12 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[380px] h-[240px] bg-pizza-gold/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Coluna Editorial Principal */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-2">
              <Badge variant="terracotta" className="px-3 py-1 font-semibold">
                <Flame className="w-3.5 h-3.5 text-pizza-terracotta" />
                <span>Forno a Lenha 450°C</span>
              </Badge>
              <Badge variant="warning" className="px-3 py-1 font-semibold">
                <Award className="w-3.5 h-3.5 text-pizza-gold" />
                <span>Fermentação Lenta 48h</span>
              </Badge>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-black text-pizza-cream font-display tracking-tight leading-[1.08]">
              Pizzas de Verdade,{" "}
              <span className="text-pizza-gold">Sabor Inesquecível.</span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-stone-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Massa artesanal de longa maturação, molho de tomate pelati italiano e queijos selecionados.
              Monte sua pizza inteira ou meio a meio com acompanhamento ao vivo da cozinha até sua mesa.
            </p>

            {/* Indicadores Operacionais */}
            <div className="pt-1 flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs font-medium text-stone-200">
              <div className="flex items-center gap-2 bg-pizza-charcoal px-3.5 py-2 rounded-xl border border-pizza-border tabular-nums">
                <Clock className="w-4 h-4 text-pizza-gold" />
                <span>Média de {avgDeliveryMin} min no delivery</span>
              </div>
              <div className="flex items-center gap-2 bg-pizza-charcoal px-3.5 py-2 rounded-xl border border-pizza-border">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Caixa térmica lacrada</span>
              </div>
            </div>

            {/* Chamadas para Ação */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <a href="#cardapio" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto font-bold text-base gap-2 px-7">
                  <span>Explorar o Cardápio</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </a>
              <a href="#sobre" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto text-base px-6">
                  Nossa Tradição
                </Button>
              </a>
              <Link href="/demo" className="w-full sm:w-auto">
                <Button variant="ghost" size="lg" className="w-full sm:w-auto text-sm px-4 border border-pizza-gold/30 text-pizza-gold hover:bg-pizza-gold/10">
                  Demo Cozinha + Cliente
                </Button>
              </Link>
            </div>
          </div>

          {/* Showcase Fotográfico + Pilares Artesanais */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md bg-pizza-charcoal-card border border-pizza-border rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
              {/* Fotografia do Forno a Lenha */}
              <div className="relative h-52 sm:h-56 w-full overflow-hidden bg-pizza-charcoal">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={withBasePath("/images/hero-forno.webp")}
                  alt="Forno a lenha artesanal aceso com pizza napolitana recém-assada"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-pizza-charcoal-card via-pizza-charcoal-card/35 to-transparent" />

                <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pizza-charcoal/85 backdrop-blur-md border border-white/10 text-[11px] font-bold text-pizza-cream">
                    <Flame className="w-3.5 h-3.5 text-pizza-terracotta" />
                    <span>Tradição Napolitana</span>
                  </span>
                  <Badge variant={isStoreOpen ? "success" : "danger"} dot pulse={isStoreOpen}>
                    {isStoreOpen ? "Forno Ativo" : "Forno Pausado"}
                  </Badge>
                </div>

                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-pizza-gold">
                    <Star className="w-3.5 h-3.5 fill-pizza-gold text-pizza-gold" />
                    <span className="tabular-nums">4.9</span>
                    <span className="text-stone-300 font-normal">(+2.400 avaliações)</span>
                  </span>
                  <span className="text-[11px] text-stone-300 font-medium">Pedra Vulcânica</span>
                </div>
              </div>

              {/* Pilares da Experiência */}
              <div className="p-5 space-y-3 text-left">
                <div className="p-3 rounded-2xl bg-pizza-charcoal/90 border border-pizza-border flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pizza-terracotta/15 border border-pizza-terracotta/30 flex items-center justify-center shrink-0 text-pizza-terracotta">
                    <Pizza className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-pizza-cream">
                      Meio a Meio nos Tamanhos M, G e Família
                    </h2>
                    <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">
                      {halfRuleText}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-pizza-charcoal/90 border border-pizza-border flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pizza-gold/15 border border-pizza-gold/30 flex items-center justify-center shrink-0 text-pizza-gold">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-pizza-cream">
                      Bordas Vulcão & Catupiry Original
                    </h2>
                    <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">
                      Recheios preparados na hora para valorizar cada fatia até a última mordida.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-pizza-charcoal/90 border border-pizza-border flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                    <Bike className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-pizza-cream">
                      Rastreamento Ao Vivo da Cozinha
                    </h2>
                    <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">
                      Acompanhe preparo, forno e saída para entrega em tempo real ou retire no balcão.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
