"use client";

import * as React from "react";
import type {
  Product,
  PizzaSize,
  CrustOption,
  ExtraOption,
  OrderItem,
  SelectedFlavor,
} from "@/types/domain";
import { formatCentsToBRL } from "@/domain/currency";
import { calculateItemPrice } from "@/domain/pricing";
import { useCartStore } from "@/store/cartStore";
import { useToast } from "@/components/ui/Toast";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { withBasePath } from "@/lib/assetPath";
import {
  Sparkles,
  Check,
  Plus,
  Minus,
  AlertCircle,
  Info,
} from "lucide-react";

interface PizzaBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProduct: Product | null;
  allPizzas: Product[];
}

/**
 * Preview Visual SVG Interativo da Pizza (Inteira ou Meio a Meio)
 * Renderiza em tempo real as metades, divisões proporcionais de fatias e anel de borda recheada.
 */
function PizzaVisualPreview({
  primaryFlavor,
  secondaryFlavor,
  isHalfAndHalf,
  slices,
  hasStuffedCrust,
  crustName,
}: {
  primaryFlavor: Product | null;
  secondaryFlavor: Product | null;
  isHalfAndHalf: boolean;
  slices: number;
  hasStuffedCrust: boolean;
  crustName?: string;
}) {
  const uniqueId = React.useId().replace(/:/g, "");
  const leftClipId = `pizza-left-${uniqueId}`;
  const rightClipId = `pizza-right-${uniqueId}`;
  const fullClipId = `pizza-full-${uniqueId}`;

  const primaryImg = withBasePath(primaryFlavor?.images?.[0] || "/images/margherita.webp");
  const secondaryImg = withBasePath(secondaryFlavor?.images?.[0]);

  // Gera ângulos para as linhas de corte proporcionais ao número de fatias (4, 6, 8 ou 12)
  const sliceCount = slices > 0 ? slices : 8;
  const sliceLines = React.useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const halfLines = Math.floor(sliceCount / 2);
    const radius = 84;
    for (let i = 0; i < halfLines; i++) {
      const angleRad = (Math.PI * i) / halfLines + (sliceCount === 4 ? Math.PI / 4 : 0);
      const dx = Math.cos(angleRad) * radius;
      const dy = Math.sin(angleRad) * radius;
      lines.push({
        x1: 100 - dx,
        y1: 100 - dy,
        x2: 100 + dx,
        y2: 100 + dy,
      });
    }
    return lines;
  }, [sliceCount]);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-pizza-charcoal border border-pizza-border">
      <div className="relative w-36 h-36 shrink-0">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-xl"
          role="img"
          aria-label={
            isHalfAndHalf && secondaryFlavor
              ? `Prévia pizza meio a meio: ${primaryFlavor?.name} e ${secondaryFlavor.name}, ${sliceCount} fatias`
              : `Prévia pizza inteira ${primaryFlavor?.name || ""}, ${sliceCount} fatias`
          }
        >
          <defs>
            <clipPath id={fullClipId}>
              <circle cx="100" cy="100" r="84" />
            </clipPath>
            <clipPath id={leftClipId}>
              <rect x="0" y="0" width="100" height="200" />
            </clipPath>
            <clipPath id={rightClipId}>
              <rect x="100" y="0" width="100" height="200" />
            </clipPath>
          </defs>

          {/* Borda Externa da Massa / Indicador Dourado de Borda Recheada */}
          <circle
            cx="100"
            cy="100"
            r="94"
            fill={hasStuffedCrust ? "#D97706" : "#5C3A21"}
            stroke={hasStuffedCrust ? "#F59E0B" : "#8B5A2B"}
            strokeWidth={hasStuffedCrust ? "5" : "3"}
          />
          {hasStuffedCrust && (
            <circle
              cx="100"
              cy="100"
              r="88"
              fill="none"
              stroke="#FEF3C7"
              strokeWidth="1.5"
              strokeDasharray="6 4"
              opacity="0.7"
            />
          )}

          {/* Base / Recheio 1º Sabor */}
          <g clipPath={`url(#${fullClipId})`}>
            <circle cx="100" cy="100" r="84" fill="#2A1D17" />
            <g clipPath={isHalfAndHalf ? `url(#${leftClipId})` : undefined}>
              <image
                href={primaryImg}
                x="16"
                y="16"
                width="168"
                height="168"
                preserveAspectRatio="xMidYMid slice"
              />
            </g>

            {/* 2º Sabor (Metade Direita quando Meio a Meio) */}
            {isHalfAndHalf && (
              <g clipPath={`url(#${rightClipId})`}>
                {secondaryImg ? (
                  <image
                    href={secondaryImg}
                    x="16"
                    y="16"
                    width="168"
                    height="168"
                    preserveAspectRatio="xMidYMid slice"
                  />
                ) : (
                  <g>
                    <rect x="100" y="16" width="84" height="168" fill="#1E1B18" />
                    <text
                      x="142"
                      y="105"
                      textAnchor="middle"
                      fill="#F59E0B"
                      fontSize="14"
                      fontWeight="bold"
                    >
                      1/2 ?
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* Linhas de Corte das Fatias */}
            {sliceLines.map((line, i) => (
              <line
                key={i}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="rgba(18, 18, 20, 0.55)"
                strokeWidth="2"
              />
            ))}

            {/* Linha Central de Divisão Meio a Meio */}
            {isHalfAndHalf && (
              <line
                x1="100"
                y1="14"
                x2="100"
                y2="186"
                stroke="#F59E0B"
                strokeWidth="2.5"
                strokeDasharray="4 3"
              />
            )}
          </g>
        </svg>
      </div>

      {/* Resumo Ao Vivo da Montagem */}
      <div className="flex-1 text-center sm:text-left space-y-1.5">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
          <Badge variant="terracotta" className="text-[10px]">
            {isHalfAndHalf ? "Meio a Meio (2 Sabores)" : "Sabor Inteiro"}
          </Badge>
          <Badge variant="outline" className="text-[10px] tabular-nums">
            {sliceCount} fatias
          </Badge>
          {hasStuffedCrust && crustName && (
            <Badge variant="warning" className="text-[10px]">
              {crustName}
            </Badge>
          )}
        </div>

        <p className="text-sm font-bold text-pizza-cream font-display leading-snug">
          {isHalfAndHalf
            ? `½ ${primaryFlavor?.name || ""} + ½ ${secondaryFlavor?.name || "Escolha o 2º sabor"}`
            : primaryFlavor?.name}
        </p>

        <p className="text-[11px] text-stone-400 leading-relaxed">
          {primaryFlavor?.description}
        </p>
      </div>
    </div>
  );
}

export function PizzaBuilderModal({
  isOpen,
  onClose,
  initialProduct,
  allPizzas,
}: PizzaBuilderModalProps) {
  const { showToast } = useToast();
  const addItem = useCartStore((s) => s.addItem);
  const halfAndHalfRule = useCartStore((s) => s.halfAndHalfRule);

  // Estados de Personalização
  const [selectedSize, setSelectedSize] = React.useState<PizzaSize | null>(
    initialProduct?.sizes.find((s) => s.id === "size-grande") ||
      initialProduct?.sizes[0] ||
      null
  );
  const [isHalfAndHalf, setIsHalfAndHalf] = React.useState(false);
  const [primaryFlavor, setPrimaryFlavor] = React.useState<Product | null>(initialProduct);
  const [secondaryFlavor, setSecondaryFlavor] = React.useState<Product | null>(null);
  const [selectedCrust, setSelectedCrust] = React.useState<CrustOption | null>(
    initialProduct?.crust_options.find((c) => c.price_cents === 0) ||
      initialProduct?.crust_options[0] ||
      null
  );
  const [selectedExtras, setSelectedExtras] = React.useState<ExtraOption[]>([]);
  const [removedIngredients, setRemovedIngredients] = React.useState<string[]>([]);
  const [notes, setNotes] = React.useState("");
  const [quantity, setQuantity] = React.useState(1);
  const [validationError, setValidationError] = React.useState<string | null>(null);

  // Inicializa a personalização quando o modal abre com um produto
  React.useEffect(() => {
    if (initialProduct && isOpen) {
      setPrimaryFlavor(initialProduct);
      const defaultSize =
        initialProduct.sizes.find((s) => s.id === "size-grande") ||
        initialProduct.sizes[0] ||
        null;
      setSelectedSize(defaultSize);

      const defaultCrust =
        initialProduct.crust_options.find((c) => c.price_cents === 0) ||
        initialProduct.crust_options[0] ||
        null;
      setSelectedCrust(defaultCrust);

      setIsHalfAndHalf(false);
      setSecondaryFlavor(null);
      setSelectedExtras([]);
      setRemovedIngredients([]);
      setNotes("");
      setQuantity(1);
      setValidationError(null);
    }
  }, [initialProduct, isOpen]);

  // Se o tamanho mudar para Brotinho (max_flavors = 1), desativa Meio a Meio automaticamente
  React.useEffect(() => {
    if (selectedSize && selectedSize.max_flavors === 1 && isHalfAndHalf) {
      setIsHalfAndHalf(false);
      setSecondaryFlavor(null);
    }
  }, [selectedSize, isHalfAndHalf]);

  // Combina ingredientes removíveis do 1º sabor e do 2º sabor (sem duplicatas)
  const availableRemovableIngredients = React.useMemo(() => {
    const set = new Set<string>(primaryFlavor?.removable_ingredients || []);
    if (isHalfAndHalf && secondaryFlavor) {
      secondaryFlavor.removable_ingredients.forEach((ing) => set.add(ing));
    }
    return Array.from(set);
  }, [primaryFlavor, isHalfAndHalf, secondaryFlavor]);

  /**
   * REGRA DE NEGÓCIO — PRECIFICAÇÃO MEIO A MEIO:
   * - Cada sabor consulta seu próprio preço na tabela de tamanhos (sizes) correspondente ao tamanho selecionado.
   * - O motor de domínio (`calculateItemPrice`) aplica a regra global da loja (`StoreSettings.half_and_half_pricing_rule`):
   *   1) `maior_valor`: cobra pelo sabor mais caro dentre os 2 escolhidos (`Math.max(f1, f2)`).
   *   2) `media_ponderada`: calcula a média aritmética exata em centavos inteiros (`Math.round((f1 + f2) / 2)`).
   * - Toda a matemática usa centavos inteiros; o backend revalida tudo no checkout.
   */
  const selectedFlavors: SelectedFlavor[] = React.useMemo(() => {
    if (!selectedSize || !primaryFlavor) return [];

    const getFlavorPriceForSize = (p: Product, sizeId: string) => {
      const sizeCfg = p.sizes.find((s) => s.id === sizeId);
      return sizeCfg ? sizeCfg.price_cents : p.sizes[0]?.price_cents || 0;
    };

    const flavors: SelectedFlavor[] = [
      {
        product_id: primaryFlavor.id,
        name: primaryFlavor.name,
        price_cents: getFlavorPriceForSize(primaryFlavor, selectedSize.id),
      },
    ];

    if (isHalfAndHalf && secondaryFlavor) {
      flavors.push({
        product_id: secondaryFlavor.id,
        name: secondaryFlavor.name,
        price_cents: getFlavorPriceForSize(secondaryFlavor, selectedSize.id),
      });
    }

    return flavors;
  }, [selectedSize, primaryFlavor, isHalfAndHalf, secondaryFlavor]);

  // Cálculo de Preço em Tempo Real via Motor de Domínio Puro
  const calculatedPrice = React.useMemo(() => {
    if (!selectedSize || selectedFlavors.length === 0) return null;

    try {
      return calculateItemPrice({
        isPizza: true,
        size: selectedSize,
        flavors: selectedFlavors,
        crust: selectedCrust || undefined,
        extras: selectedExtras,
        quantity,
        halfAndHalfRule,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setValidationError(err.message);
      }
      return null;
    }
  }, [selectedSize, selectedFlavors, selectedCrust, selectedExtras, quantity, halfAndHalfRule]);

  const handleAddToCart = () => {
    setValidationError(null);

    if (!selectedSize) {
      setValidationError("Por favor, selecione um tamanho de pizza.");
      return;
    }

    if (!primaryFlavor) {
      setValidationError("Selecione o sabor da pizza.");
      return;
    }

    if (isHalfAndHalf && !secondaryFlavor) {
      setValidationError("Por favor, selecione o segundo sabor ou desmarque a opção meio a meio.");
      return;
    }

    if (isHalfAndHalf && secondaryFlavor?.id === primaryFlavor.id) {
      setValidationError("O segundo sabor deve ser diferente do primeiro para meio a meio.");
      return;
    }

    if (!calculatedPrice) {
      setValidationError("Erro ao calcular valor da pizza. Revise as opções.");
      return;
    }

    const orderItem: OrderItem = {
      id: `pizza-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      product_id: primaryFlavor.id,
      name: isHalfAndHalf
        ? `1/2 ${primaryFlavor.name} + 1/2 ${secondaryFlavor?.name}`
        : primaryFlavor.name,
      is_pizza: true,
      size: selectedSize,
      flavors: selectedFlavors,
      crust: selectedCrust || undefined,
      extras: selectedExtras,
      removed_ingredients: removedIngredients,
      notes: notes.trim() || undefined,
      unit_price_cents: calculatedPrice.unitPriceCents,
      quantity,
      total_price_cents: calculatedPrice.totalPriceCents,
    };

    addItem(orderItem);
    showToast(
      `${orderItem.name} (${selectedSize.name}) adicionada ao carrinho!`,
      "success",
      "Adicionado com Sucesso"
    );
    onClose();
  };

  if (!initialProduct) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Personalize sua Pizza Artesanal"
      description="Massa de fermentação lenta de 48h, assada no forno a lenha."
      maxWidth="lg"
      className="max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-7 text-left py-2">
        {/* Preview Visual SVG em Tempo Real */}
        <PizzaVisualPreview
          primaryFlavor={primaryFlavor}
          secondaryFlavor={secondaryFlavor}
          isHalfAndHalf={isHalfAndHalf}
          slices={selectedSize?.slices || 8}
          hasStuffedCrust={Boolean(selectedCrust && selectedCrust.price_cents > 0)}
          crustName={selectedCrust?.name}
        />

        {/* Banner de Erro de Validação */}
        {validationError && (
          <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* 1. SELEÇÃO DE TAMANHO */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-pizza-terracotta/20 text-pizza-terracotta flex items-center justify-center text-[10px]">
                1
              </span>
              Escolha o Tamanho
            </h4>
            <span className="text-[11px] text-stone-400">Obrigatório</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {initialProduct.sizes.map((size) => {
              const isSelected = selectedSize?.id === size.id;
              return (
                <button
                  key={size.id}
                  type="button"
                  onClick={() => {
                    setSelectedSize(size);
                    setValidationError(null);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all relative min-h-[88px] ${
                    isSelected
                      ? "bg-pizza-terracotta/15 border-pizza-terracotta shadow-md shadow-pizza-terracotta/10"
                      : "bg-pizza-charcoal border-pizza-border hover:border-stone-600"
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-pizza-terracotta text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                  <span className="font-bold text-sm text-pizza-cream block">
                    {size.name.split(" ")[0]}
                  </span>
                  <span className="text-[11px] text-stone-400 block mt-0.5 tabular-nums">
                    {size.slices} fatias
                  </span>
                  <span className="text-xs font-bold text-pizza-gold block mt-2 tabular-nums">
                    {formatCentsToBRL(size.price_cents)}
                  </span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">
                    {size.max_flavors === 1 ? "1 sabor" : "Até 2 sabores"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. MODALIDADE DE SABORES: 1 SABOR OU MEIO A MEIO */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-pizza-terracotta/20 text-pizza-terracotta flex items-center justify-center text-[10px]">
                2
              </span>
              Sabores da Pizza
            </h4>
            {selectedSize?.max_flavors === 1 && (
              <span className="text-[11px] text-amber-400 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Brotinho permite apenas 1 sabor
              </span>
            )}
          </div>

          {selectedSize && selectedSize.max_flavors > 1 && (
            <div className="flex gap-2 p-1 bg-pizza-charcoal rounded-xl border border-pizza-border">
              <button
                type="button"
                onClick={() => {
                  setIsHalfAndHalf(false);
                  setSecondaryFlavor(null);
                }}
                className={`flex-1 min-h-[40px] py-2 rounded-lg text-xs font-bold transition-colors ${
                  !isHalfAndHalf
                    ? "bg-pizza-terracotta text-white shadow-sm"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                1 Sabor Inteiro
              </button>
              <button
                type="button"
                onClick={() => setIsHalfAndHalf(true)}
                className={`flex-1 min-h-[40px] py-2 rounded-lg text-xs font-bold transition-colors ${
                  isHalfAndHalf
                    ? "bg-pizza-terracotta text-white shadow-sm"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                Meio a Meio (2 Sabores)
              </button>
            </div>
          )}

          {/* Sabor Primário */}
          <div className="p-3.5 rounded-xl bg-pizza-charcoal border border-pizza-border flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-pizza-terracotta block">
                {isHalfAndHalf ? "1º Sabor (1/2)" : "Sabor Escolhido"}
              </span>
              <span className="text-sm font-bold text-pizza-cream">{primaryFlavor?.name || ""}</span>
            </div>
            <Badge variant="terracotta">Selecionado</Badge>
          </div>

          {/* Sabor Secundário (Se Meio a Meio) */}
          {isHalfAndHalf && (
            <div className="space-y-2 pt-1">
              <span className="text-[10px] uppercase font-bold text-pizza-gold block">
                Escolha o 2º Sabor (1/2):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {allPizzas
                  .filter((p) => p.id !== primaryFlavor?.id && p.is_active)
                  .map((pizza) => {
                    const isSelected = secondaryFlavor?.id === pizza.id;
                    const priceForSize = selectedSize
                      ? pizza.sizes.find((s) => s.id === selectedSize.id)?.price_cents ||
                        pizza.sizes[0]?.price_cents ||
                        0
                      : 0;

                    return (
                      <button
                        key={pizza.id}
                        type="button"
                        onClick={() => {
                          setSecondaryFlavor(pizza);
                          setValidationError(null);
                        }}
                        className={`p-2.5 min-h-[48px] rounded-xl border text-left flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-pizza-gold/15 border-pizza-gold text-white font-bold"
                            : "bg-pizza-charcoal border-pizza-border text-stone-300 hover:border-stone-600"
                        }`}
                      >
                        <div className="truncate mr-2">
                          <span className="text-xs block truncate">{pizza.name}</span>
                          <span className="text-[10px] text-stone-400 block tabular-nums">
                            {formatCentsToBRL(priceForSize)}
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-pizza-gold shrink-0" />}
                      </button>
                    );
                  })}
              </div>
              <p className="text-[11px] text-stone-400 pt-1">
                Regra de Meio a Meio da Loja:{" "}
                <strong className="text-pizza-cream">
                  {halfAndHalfRule === "maior_valor"
                    ? "Preço do Sabor de Maior Valor"
                    : "Média Ponderada dos Sabores"}
                </strong>
              </p>
            </div>
          )}
        </section>

        {/* 3. BORDA RECHEADA */}
        {initialProduct.crust_options.length > 0 && (
          <section className="space-y-3">
            <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-pizza-terracotta/20 text-pizza-terracotta flex items-center justify-center text-[10px]">
                3
              </span>
              Borda Recheada
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {initialProduct.crust_options.map((crust) => {
                const isSelected = selectedCrust?.id === crust.id;
                return (
                  <button
                    key={crust.id}
                    type="button"
                    onClick={() => setSelectedCrust(crust)}
                    className={`p-3 min-h-[44px] rounded-xl border text-left flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-pizza-terracotta/15 border-pizza-terracotta text-white font-bold"
                        : "bg-pizza-charcoal border-pizza-border text-stone-300 hover:border-stone-600"
                    }`}
                  >
                    <span className="text-xs">{crust.name}</span>
                    <span className="text-xs font-bold text-pizza-gold tabular-nums">
                      {crust.price_cents === 0 ? "Grátis" : `+ ${formatCentsToBRL(crust.price_cents)}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* 4. EXTRAS / ADICIONAIS */}
        {initialProduct.extras.length > 0 && (
          <section className="space-y-3">
            <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-pizza-terracotta/20 text-pizza-terracotta flex items-center justify-center text-[10px]">
                4
              </span>
              Adicionais Extras
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {initialProduct.extras.map((extra) => {
                const isSelected = selectedExtras.some((e) => e.id === extra.id);
                return (
                  <button
                    key={extra.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedExtras((prev) => prev.filter((e) => e.id !== extra.id));
                      } else {
                        setSelectedExtras((prev) => [...prev, extra]);
                      }
                    }}
                    className={`p-3 min-h-[44px] rounded-xl border text-left flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-pizza-gold/15 border-pizza-gold text-white font-bold"
                        : "bg-pizza-charcoal border-pizza-border text-stone-300 hover:border-stone-600"
                    }`}
                  >
                    <span className="text-xs">{extra.name}</span>
                    <span className="text-xs font-bold text-pizza-gold tabular-nums">
                      + {formatCentsToBRL(extra.price_cents)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* 5. REMOÇÃO DE INGREDIENTES (Combina 1º e 2º sabor) */}
        {availableRemovableIngredients.length > 0 && (
          <section className="space-y-3">
            <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-pizza-terracotta/20 text-pizza-terracotta flex items-center justify-center text-[10px]">
                5
              </span>
              Remover Ingredientes
            </h4>
            <div className="flex flex-wrap gap-2">
              {availableRemovableIngredients.map((ing) => {
                const isRemoved = removedIngredients.includes(ing);
                return (
                  <button
                    key={ing}
                    type="button"
                    onClick={() => {
                      if (isRemoved) {
                        setRemovedIngredients((prev) => prev.filter((i) => i !== ing));
                      } else {
                        setRemovedIngredients((prev) => [...prev, ing]);
                      }
                    }}
                    className={`min-h-[36px] px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      isRemoved
                        ? "bg-red-500/20 text-red-300 border-red-500/40 line-through"
                        : "bg-pizza-charcoal text-stone-300 border-pizza-border hover:border-stone-600"
                    }`}
                  >
                    <span>{ing}</span>
                    {isRemoved && <span className="text-[10px] font-bold">(Sem)</span>}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* 6. OBSERVAÇÕES */}
        <section className="space-y-2">
          <label
            htmlFor="pizza-notes"
            className="block text-xs font-bold text-stone-300 uppercase tracking-wider"
          >
            Observações para a Cozinha
          </label>
          <textarea
            id="pizza-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Massa bem tostadinha, caprichar no orégano, etc."
            className="w-full p-3 rounded-xl bg-pizza-charcoal border border-pizza-border text-sm text-pizza-cream placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-pizza-terracotta resize-none"
          />
        </section>

        {/* Breakdown Transparente do Cálculo */}
        {calculatedPrice && (
          <div className="p-3 rounded-xl bg-pizza-charcoal/80 border border-pizza-border/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-400 tabular-nums">
            <span>
              Base: <strong className="text-stone-200">{formatCentsToBRL(calculatedPrice.basePriceCents)}</strong>
              {calculatedPrice.crustPriceCents > 0 && (
                <> • Borda: <strong className="text-stone-200">+{formatCentsToBRL(calculatedPrice.crustPriceCents)}</strong></>
              )}
              {calculatedPrice.extrasPriceCents > 0 && (
                <> • Extras: <strong className="text-stone-200">+{formatCentsToBRL(calculatedPrice.extrasPriceCents)}</strong></>
              )}
            </span>
            <span>
              Unitário: <strong className="text-pizza-cream">{formatCentsToBRL(calculatedPrice.unitPriceCents)}</strong>
            </span>
          </div>
        )}

        {/* 7. FOOTER FIXO DE RESUMO E QUANTIDADE */}
        <div className="pt-4 border-t border-pizza-border flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Controle de Quantidade */}
          <div className="flex items-center gap-3 bg-pizza-charcoal p-1.5 rounded-xl border border-pizza-border">
            <button
              type="button"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center text-white transition-colors"
              aria-label="Diminuir quantidade"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-bold text-sm px-2 tabular-nums">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
              aria-label="Aumentar quantidade"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Preço Total & Botão */}
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-stone-400 block">
                Total do Item
              </span>
              <span className="text-xl font-black text-pizza-gold tabular-nums">
                {calculatedPrice ? formatCentsToBRL(calculatedPrice.totalPriceCents) : "R$ 0,00"}
              </span>
            </div>

            <Button
              size="lg"
              variant="primary"
              onClick={handleAddToCart}
              className="font-bold text-sm px-6 min-h-[44px]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Adicionar ao Pedido</span>
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
