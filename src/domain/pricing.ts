/**
 * Domain Pricing Engine — Motor de Cálculo de Preço de Itens
 * 
 * REGRA ARQUITETURAL FUNDAMENTAL:
 * - Toda a matemática opera em centavos inteiros (cents).
 * - Função pura, determinística e livre de efeitos colaterais.
 * - Suporta sabor único e meio a meio com regras 'maior_valor' e 'media_ponderada'.
 * - Valida integridade de regras (ex: proíbe 2 sabores em tamanhos de 1 sabor).
 */

import type {
  PizzaSize,
  CrustOption,
  ExtraOption,
  SelectedFlavor,
  HalfAndHalfRule,
} from "@/types/domain";

export interface CalculateItemPriceParams {
  isPizza: boolean;
  basePriceCents?: number; // Para itens que não são pizza (ex: bebidas)
  size?: PizzaSize;
  flavors?: SelectedFlavor[];
  crust?: CrustOption;
  extras?: ExtraOption[];
  quantity: number;
  halfAndHalfRule?: HalfAndHalfRule;
}

export interface CalculatedPriceResult {
  basePriceCents: number;
  crustPriceCents: number;
  extrasPriceCents: number;
  unitPriceCents: number;
  quantity: number;
  totalPriceCents: number;
  ruleApplied?: HalfAndHalfRule;
}

export class PricingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingValidationError";
  }
}

/**
 * Calcula o preço unitário e total de um item de pedido.
 */
export function calculateItemPrice({
  isPizza,
  basePriceCents = 0,
  size,
  flavors = [],
  crust,
  extras = [],
  quantity,
  halfAndHalfRule = "maior_valor",
}: CalculateItemPriceParams): CalculatedPriceResult {
  // 1. Validação de Quantidade
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new PricingValidationError(
      `Quantidade inválida: ${quantity}. A quantidade deve ser um número inteiro positivo.`
    );
  }

  // 2. Cálculo para Itens Regulares (Bebidas, Sobremesas, etc.)
  if (!isPizza) {
    if (!Number.isInteger(basePriceCents) || basePriceCents < 0) {
      throw new PricingValidationError(
        `Preço base inválido para item regular: ${basePriceCents}. Deve ser um inteiro de centavos.`
      );
    }
    const unitPriceCents = basePriceCents;
    return {
      basePriceCents,
      crustPriceCents: 0,
      extrasPriceCents: 0,
      unitPriceCents,
      quantity,
      totalPriceCents: unitPriceCents * quantity,
    };
  }

  // 3. Validações de Pizza
  if (!size) {
    throw new PricingValidationError("Um tamanho de pizza válido deve ser informado.");
  }

  if (!Number.isInteger(size.price_cents) || size.price_cents < 0) {
    throw new PricingValidationError(
      `Preço do tamanho inválido: ${size.price_cents}. Deve ser inteiro de centavos.`
    );
  }

  if (flavors.length === 0) {
    throw new PricingValidationError("Ao menos um sabor de pizza deve ser selecionado.");
  }

  if (flavors.length > size.max_flavors) {
    throw new PricingValidationError(
      `O tamanho "${size.name}" permite no máximo ${size.max_flavors} sabor(es), mas foram enviados ${flavors.length}.`
    );
  }

  // Valida integridade de centavos de cada sabor
  for (const f of flavors) {
    if (!Number.isInteger(f.price_cents) || f.price_cents < 0) {
      throw new PricingValidationError(
        `Preço do sabor "${f.name}" inválido: ${f.price_cents}. Deve ser inteiro de centavos.`
      );
    }
  }

  // 4. Cálculo do Preço Base da Pizza
  let calculatedBasePriceCents = 0;

  if (flavors.length === 1) {
    // Sabor Único: utiliza o preço do sabor selecionado
    const singleFlavor = flavors[0]!;
    calculatedBasePriceCents = singleFlavor.price_cents;
  } else if (flavors.length === 2) {
    // Meio a Meio: 2 sabores
    const f1 = flavors[0]!;
    const f2 = flavors[1]!;

    if (halfAndHalfRule === "maior_valor") {
      calculatedBasePriceCents = Math.max(f1.price_cents, f2.price_cents);
    } else if (halfAndHalfRule === "media_ponderada") {
      // Média aritmética de centavos com arredondamento determinístico
      calculatedBasePriceCents = Math.round((f1.price_cents + f2.price_cents) / 2);
    } else {
      throw new PricingValidationError(`Regra de meio a meio desconhecida: "${halfAndHalfRule}".`);
    }
  }

  // 5. Cálculo do Preço da Borda Recheada
  let crustPriceCents = 0;
  if (crust) {
    if (!Number.isInteger(crust.price_cents) || crust.price_cents < 0) {
      throw new PricingValidationError(
        `Preço da borda "${crust.name}" inválido: ${crust.price_cents}. Deve ser inteiro de centavos.`
      );
    }
    crustPriceCents = crust.price_cents;
  }

  // 6. Cálculo dos Extras / Adicionais
  let extrasPriceCents = 0;
  for (const extra of extras) {
    if (!Number.isInteger(extra.price_cents) || extra.price_cents < 0) {
      throw new PricingValidationError(
        `Preço do adicional "${extra.name}" inválido: ${extra.price_cents}. Deve ser inteiro de centavos.`
      );
    }
    extrasPriceCents += extra.price_cents;
  }

  // 7. Consolidação Final
  const unitPriceCents = calculatedBasePriceCents + crustPriceCents + extrasPriceCents;
  const totalPriceCents = unitPriceCents * quantity;

  return {
    basePriceCents: calculatedBasePriceCents,
    crustPriceCents,
    extrasPriceCents,
    unitPriceCents,
    quantity,
    totalPriceCents,
    ruleApplied: flavors.length > 1 ? halfAndHalfRule : undefined,
  };
}
