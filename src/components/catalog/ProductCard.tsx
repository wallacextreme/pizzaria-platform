"use client";

import * as React from "react";
import type { Product } from "@/types/domain";
import { formatCentsToBRL } from "@/domain/currency";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { withBasePath } from "@/lib/assetPath";
import { Plus, Sparkles, Leaf, Flame, Pizza, CupSoda } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onCustomizePizza: (product: Product) => void;
  onAddRegularItem: (product: Product) => void;
}

export function ProductCard({
  product,
  onCustomizePizza,
  onAddRegularItem,
}: ProductCardProps) {
  const [imageFailed, setImageFailed] = React.useState(false);

  // Encontra o menor preço base configurado para o tamanho
  const lowestPriceCents = React.useMemo(() => {
    if (product.sizes.length === 0) return 0;
    return Math.min(...product.sizes.map((s) => s.price_cents));
  }, [product.sizes]);

  const isPizza = product.flags.is_pizza;
  const primaryImage = withBasePath(product.images?.[0]);

  React.useEffect(() => {
    setImageFailed(false);
  }, [primaryImage]);

  const sliceSummary = React.useMemo(() => {
    if (!isPizza || product.sizes.length === 0) return null;
    const slices = product.sizes.map((s) => s.slices).filter((s) => s > 0);
    if (slices.length === 0) return null;
    const minSlices = Math.min(...slices);
    const maxSlices = Math.max(...slices);
    const supportsHalf = product.sizes.some((s) => s.max_flavors > 1);
    const rangeLabel = minSlices === maxSlices ? `${minSlices} fatias` : `${minSlices} a ${maxSlices} fatias`;
    return supportsHalf ? `${rangeLabel} • Meio a meio` : rangeLabel;
  }, [isPizza, product.sizes]);

  return (
    <Card
      hoverable={product.is_active}
      className={`group flex flex-col justify-between h-full overflow-hidden transition-all duration-300 ${
        !product.is_active ? "opacity-65 grayscale-[60%]" : ""
      }`}
    >
      {/* Mídia Gastronômica WebP (16:10) */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-pizza-charcoal border-b border-pizza-border">
        {primaryImage && !imageFailed ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={primaryImage}
            alt={product.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-stone-500 bg-gradient-to-br from-pizza-charcoal to-pizza-charcoal-card">
            {isPizza ? (
              <Pizza className="w-10 h-10 text-pizza-terracotta/60" />
            ) : (
              <CupSoda className="w-10 h-10 text-pizza-gold/60" />
            )}
            <span className="text-[11px] font-medium text-stone-400">Forno &amp; Massa</span>
          </div>
        )}

        {/* Gradiente sutil para legibilidade das badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-pizza-charcoal-card/90 via-transparent to-black/45 pointer-events-none" />

        {/* Badges Superiores (Destaque + Dietéticos) */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {product.flags.badge && (
              <Badge
                variant={product.flags.is_featured ? "terracotta" : "warning"}
                className="text-[10px] uppercase font-bold tracking-wider backdrop-blur-md bg-pizza-charcoal/85"
              >
                {product.flags.badge}
              </Badge>
            )}
            {product.flags.vegetarian && (
              <Badge
                variant="success"
                className="text-[10px] font-semibold backdrop-blur-md bg-pizza-charcoal/85"
              >
                <Leaf className="w-3 h-3" />
                <span>Vegetariana</span>
              </Badge>
            )}
            {product.flags.spicy && (
              <Badge
                variant="danger"
                className="text-[10px] font-semibold backdrop-blur-md bg-pizza-charcoal/85"
              >
                <Flame className="w-3 h-3" />
                <span>Picante</span>
              </Badge>
            )}
          </div>

          {!product.is_active && (
            <Badge variant="danger" dot className="backdrop-blur-md bg-red-950/90 shrink-0">
              Esgotado
            </Badge>
          )}
        </div>

        {/* Metadado de tamanhos na base da imagem */}
        {sliceSummary && (
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
            <span className="text-[11px] font-medium text-stone-200 bg-pizza-charcoal/80 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/10">
              {sliceSummary}
            </span>
          </div>
        )}
      </div>

      {/* Corpo Editorial e Preço */}
      <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5 text-left">
          <h3 className="text-base sm:text-lg font-bold text-pizza-cream font-display leading-snug">
            {product.name}
          </h3>
          <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Rodapé do Card: Preço em centavos formatado e Ação */}
        <div className="pt-4 border-t border-pizza-border flex items-center justify-between gap-2">
          <div className="text-left">
            <span className="text-[10px] uppercase font-semibold text-stone-400 block">
              {isPizza ? "A partir de" : "Preço unitário"}
            </span>
            <span className="text-lg font-extrabold text-pizza-cream tabular-nums">
              {formatCentsToBRL(lowestPriceCents)}
            </span>
          </div>

          {isPizza ? (
            <Button
              size="sm"
              variant="primary"
              disabled={!product.is_active}
              onClick={() => onCustomizePizza(product)}
              className="font-bold text-xs min-h-[40px] px-3.5"
              aria-label={`Personalizar ${product.name}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{product.is_active ? "Montar Pizza" : "Indisponível"}</span>
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              disabled={!product.is_active}
              onClick={() => onAddRegularItem(product)}
              className="font-bold text-xs min-h-[40px] px-3.5 hover:border-pizza-terracotta"
              aria-label={`Adicionar ${product.name}`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{product.is_active ? "Adicionar" : "Indisponível"}</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
