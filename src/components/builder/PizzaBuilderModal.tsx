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
      // Padrão: seleciona tamanho Grande (8 fatias) se disponível, ou o primeiro
      const defaultSize =
        initialProduct.sizes.find((s) => s.id === "size-grande") ||
        initialProduct.sizes[0] ||
        null;
      setSelectedSize(defaultSize);

      // Padrão: massa tradicional (sem custo) se existir
      const defaultCrust =
        initialProduct.crust_options.find((c) => c.price_cents === 0) ||
        initialProduct.crust_options[0] ||
        null;
      setSelectedCrust(defaultCrust);

      // Reseta seleções
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

  // Monta lista de sabores selecionados com o preço correspondente ao tamanho atual
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

  // Validação e Finalização ao Carrinho
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

    // Criação do item de pedido estruturado em centavos
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
      <div className="space-y-8 text-left py-2">
        {/* Banner de Erro de Validação se houver */}
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
                  className={`p-3 rounded-xl border text-left transition-all relative ${
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
                  <span className="text-[11px] text-stone-400 block mt-0.5">
                    {size.slices} fatias
                  </span>
                  <span className="text-xs font-bold text-pizza-gold block mt-2">
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

          {/* Toggle 1 Sabor vs Meio a Meio */}
          {selectedSize && selectedSize.max_flavors > 1 && (
            <div className="flex gap-2 p-1 bg-pizza-charcoal rounded-xl border border-pizza-border">
              <button
                type="button"
                onClick={() => {
                  setIsHalfAndHalf(false);
                  setSecondaryFlavor(null);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
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
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
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
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-pizza-gold/15 border-pizza-gold text-white font-bold"
                            : "bg-pizza-charcoal border-pizza-border text-stone-300 hover:border-stone-600"
                        }`}
                      >
                        <div className="truncate mr-2">
                          <span className="text-xs block truncate">{pizza.name}</span>
                          <span className="text-[10px] text-stone-400 block">
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
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-pizza-terracotta/15 border-pizza-terracotta text-white font-bold"
                        : "bg-pizza-charcoal border-pizza-border text-stone-300 hover:border-stone-600"
                    }`}
                  >
                    <span className="text-xs">{crust.name}</span>
                    <span className="text-xs font-bold text-pizza-gold">
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
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-pizza-gold/15 border-pizza-gold text-white font-bold"
                        : "bg-pizza-charcoal border-pizza-border text-stone-300 hover:border-stone-600"
                    }`}
                  >
                    <span className="text-xs">{extra.name}</span>
                    <span className="text-xs font-bold text-pizza-gold">
                      + {formatCentsToBRL(extra.price_cents)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* 5. REMOÇÃO DE INGREDIENTES */}
        {initialProduct.removable_ingredients.length > 0 && (
          <section className="space-y-3">
            <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-pizza-terracotta/20 text-pizza-terracotta flex items-center justify-center text-[10px]">
                5
              </span>
              Remover Ingredientes
            </h4>
            <div className="flex flex-wrap gap-2">
              {initialProduct.removable_ingredients.map((ing) => {
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
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5 ${
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

        {/* 7. FOOTER FIXO DE RESUMO E QUANTIDADE */}
        <div className="pt-4 border-t border-pizza-border flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Controle de Quantidade */}
          <div className="flex items-center gap-3 bg-pizza-charcoal p-1.5 rounded-xl border border-pizza-border">
            <button
              type="button"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center text-white transition-colors"
              aria-label="Diminuir quantidade"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-bold text-sm px-2">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
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
              <span className="text-xl font-black text-pizza-gold">
                {calculatedPrice ? formatCentsToBRL(calculatedPrice.totalPriceCents) : "R$ 0,00"}
              </span>
            </div>

            <Button
              size="lg"
              variant="primary"
              onClick={handleAddToCart}
              className="font-bold text-sm px-6"
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
