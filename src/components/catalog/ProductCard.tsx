import * as React from "react";
import type { Product } from "@/types/domain";
import { formatCentsToBRL } from "@/domain/currency";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Plus, Sparkles } from "lucide-react";

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
  // Encontra o menor preço base configurado para o tamanho
  const lowestPriceCents = React.useMemo(() => {
    if (product.sizes.length === 0) return 0;
    return Math.min(...product.sizes.map((s) => s.price_cents));
  }, [product.sizes]);

  const isPizza = product.flags.is_pizza;

  return (
    <Card
      hoverable={product.is_active}
      className={`flex flex-col justify-between h-full ${
        !product.is_active ? "opacity-60 grayscale-[50%]" : ""
      }`}
    >
      <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
        {/* Header do Card: Badges e Nome */}
        <div className="space-y-2 text-left">
          <div className="flex items-center justify-between gap-2">
            {product.flags.badge ? (
              <Badge
                variant={product.flags.is_featured ? "terracotta" : "warning"}
                className="text-[10px] uppercase font-bold tracking-wider"
              >
                {product.flags.badge}
              </Badge>
            ) : (
              <span />
            )}

            {!product.is_active && (
              <Badge variant="danger" dot>
                Esgotado
              </Badge>
            )}
          </div>

          <div className="flex items-start gap-3 pt-1">
            <div className="w-12 h-12 rounded-2xl bg-pizza-charcoal border border-pizza-border flex items-center justify-center shrink-0 text-2xl select-none">
              {isPizza ? "🍕" : "🥤"}
            </div>
            <div>
              <h4 className="text-base font-bold text-pizza-cream font-display leading-snug">
                {product.name}
              </h4>
              <p className="text-xs text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé do Card: Preço e Botão de Ação */}
        <div className="pt-4 border-t border-pizza-border flex items-center justify-between gap-2">
          <div className="text-left">
            <span className="text-[10px] uppercase font-semibold text-stone-500 block">
              {isPizza ? "A partir de" : "Preço unitário"}
            </span>
            <span className="text-base font-extrabold text-pizza-cream">
              {formatCentsToBRL(lowestPriceCents)}
            </span>
          </div>

          {isPizza ? (
            <Button
              size="sm"
              variant="primary"
              disabled={!product.is_active}
              onClick={() => onCustomizePizza(product)}
              className="font-bold text-xs"
              aria-label={`Personalizar ${product.name}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Montar Pizza</span>
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              disabled={!product.is_active}
              onClick={() => onAddRegularItem(product)}
              className="font-bold text-xs hover:border-pizza-terracotta"
              aria-label={`Adicionar ${product.name}`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
