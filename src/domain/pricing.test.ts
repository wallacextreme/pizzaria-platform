import { describe, it, expect } from "vitest";
import { calculateItemPrice, PricingValidationError } from "./pricing";
import type { PizzaSize, CrustOption, ExtraOption, SelectedFlavor } from "@/types/domain";

describe("Domain Pricing Engine Suite", () => {
  const sizeBrotinho: PizzaSize = {
    id: "size-brotinho",
    name: "Brotinho",
    price_cents: 3500,
    slices: 4,
    max_flavors: 1,
  };

  const sizeGrande: PizzaSize = {
    id: "size-grande",
    name: "Grande",
    price_cents: 7000,
    slices: 8,
    max_flavors: 2,
  };

  const flavorMargherita: SelectedFlavor = {
    product_id: "prod-margherita",
    name: "Margherita Especial",
    price_cents: 7200,
  };

  const flavorCalabresa: SelectedFlavor = {
    product_id: "prod-calabresa",
    name: "Calabresa Artesanal",
    price_cents: 6800,
  };

  const flavorQuatroQueijos: SelectedFlavor = {
    product_id: "prod-quatro-queijos",
    name: "Quatro Queijos Nobres",
    price_cents: 8000,
  };

  const crustCatupiry: CrustOption = {
    id: "crust-catupiry",
    name: "Borda Catupiry",
    price_cents: 1200,
  };

  const extraBacon: ExtraOption = {
    id: "extra-bacon",
    name: "Bacon Crocante",
    price_cents: 800,
  };

  const extraQueijo: ExtraOption = {
    id: "extra-queijo",
    name: "Queijo Duplo",
    price_cents: 900,
  };

  describe("Sabor Único", () => {
    it("deve calcular o preço correto para pizza de sabor único", () => {
      const result = calculateItemPrice({
        isPizza: true,
        size: sizeGrande,
        flavors: [flavorMargherita],
        quantity: 1,
      });

      expect(result.basePriceCents).toBe(7200);
      expect(result.crustPriceCents).toBe(0);
      expect(result.extrasPriceCents).toBe(0);
      expect(result.unitPriceCents).toBe(7200);
      expect(result.totalPriceCents).toBe(7200);
    });

    it("deve multiplicar o total pela quantidade", () => {
      const result = calculateItemPrice({
        isPizza: true,
        size: sizeGrande,
        flavors: [flavorMargherita],
        quantity: 3,
      });

      expect(result.unitPriceCents).toBe(7200);
      expect(result.totalPriceCents).toBe(21600); // 7200 * 3
    });
  });

  describe("Meio a Meio — Regra: maior_valor", () => {
    it("deve adotar o maior valor quando Sabor 1 for mais caro", () => {
      const result = calculateItemPrice({
        isPizza: true,
        size: sizeGrande,
        flavors: [flavorMargherita, flavorCalabresa], // 7200 e 6800
        quantity: 1,
        halfAndHalfRule: "maior_valor",
      });

      expect(result.basePriceCents).toBe(7200);
      expect(result.unitPriceCents).toBe(7200);
      expect(result.totalPriceCents).toBe(7200);
      expect(result.ruleApplied).toBe("maior_valor");
    });

    it("deve adotar o maior valor quando Sabor 2 for mais caro", () => {
      const result = calculateItemPrice({
        isPizza: true,
        size: sizeGrande,
        flavors: [flavorCalabresa, flavorQuatroQueijos], // 6800 e 8000
        quantity: 1,
        halfAndHalfRule: "maior_valor",
      });

      expect(result.basePriceCents).toBe(8000);
      expect(result.unitPriceCents).toBe(8000);
    });

    it("deve calcular corretamente quando ambos os sabores possuem preço igual", () => {
      const flavorMargheritaClone = { ...flavorMargherita };
      const result = calculateItemPrice({
        isPizza: true,
        size: sizeGrande,
        flavors: [flavorMargherita, flavorMargheritaClone],
        quantity: 1,
        halfAndHalfRule: "maior_valor",
      });

      expect(result.basePriceCents).toBe(7200);
      expect(result.unitPriceCents).toBe(7200);
    });
  });

  describe("Meio a Meio — Regra: media_ponderada", () => {
    it("deve calcular a média aritmética exata dos dois sabores", () => {
      // 7200 + 6800 = 14000 / 2 = 7000
      const result = calculateItemPrice({
        isPizza: true,
        size: sizeGrande,
        flavors: [flavorMargherita, flavorCalabresa],
        quantity: 1,
        halfAndHalfRule: "media_ponderada",
      });

      expect(result.basePriceCents).toBe(7000);
      expect(result.unitPriceCents).toBe(7000);
      expect(result.ruleApplied).toBe("media_ponderada");
    });

    it("deve arredondar centavos ímpar deterministicamente com Math.round", () => {
      const flavorImparA = { ...flavorMargherita, price_cents: 7101 };
      const flavorImparB = { ...flavorCalabresa, price_cents: 6800 };
      // (7101 + 6800) / 2 = 13901 / 2 = 6950.5 -> 6951
      const result = calculateItemPrice({
        isPizza: true,
        size: sizeGrande,
        flavors: [flavorImparA, flavorImparB],
        quantity: 1,
        halfAndHalfRule: "media_ponderada",
      });

      expect(result.basePriceCents).toBe(6951);
    });
  });

  describe("Bordas Recheadas e Extras Adicionais", () => {
    it("deve somar borda e múltiplos adicionais ao valor unitário", () => {
      // Base: 7200 + Borda: 1200 + Extra1: 800 + Extra2: 900 = 10100
      const result = calculateItemPrice({
        isPizza: true,
        size: sizeGrande,
        flavors: [flavorMargherita],
        crust: crustCatupiry,
        extras: [extraBacon, extraQueijo],
        quantity: 2,
      });

      expect(result.basePriceCents).toBe(7200);
      expect(result.crustPriceCents).toBe(1200);
      expect(result.extrasPriceCents).toBe(1700); // 800 + 900
      expect(result.unitPriceCents).toBe(10100);
      expect(result.totalPriceCents).toBe(20200); // 10100 * 2
    });
  });

  describe("Itens Regulares (Não Pizza)", () => {
    it("deve calcular preço de itens regulares (bebidas) sem tamanho ou borda", () => {
      const result = calculateItemPrice({
        isPizza: false,
        basePriceCents: 1200, // R$ 12,00 (Refrigerante)
        quantity: 4,
      });

      expect(result.basePriceCents).toBe(1200);
      expect(result.unitPriceCents).toBe(1200);
      expect(result.totalPriceCents).toBe(4800);
    });
  });

  describe("Validações e Casos Inválidos", () => {
    it("deve lançar erro se quantidade for <= 0", () => {
      expect(() =>
        calculateItemPrice({
          isPizza: true,
          size: sizeGrande,
          flavors: [flavorMargherita],
          quantity: 0,
        })
      ).toThrow(PricingValidationError);

      expect(() =>
        calculateItemPrice({
          isPizza: true,
          size: sizeGrande,
          flavors: [flavorMargherita],
          quantity: -1,
        })
      ).toThrow(PricingValidationError);
    });

    it("deve lançar erro se quantidade for número fracionário", () => {
      expect(() =>
        calculateItemPrice({
          isPizza: true,
          size: sizeGrande,
          flavors: [flavorMargherita],
          quantity: 1.5,
        })
      ).toThrow(PricingValidationError);
    });

    it("deve lançar erro se tentar 2 sabores em tamanho com max_flavors = 1 (Brotinho)", () => {
      expect(() =>
        calculateItemPrice({
          isPizza: true,
          size: sizeBrotinho,
          flavors: [flavorMargherita, flavorCalabresa],
          quantity: 1,
        })
      ).toThrow(/permite no máximo 1 sabor/);
    });

    it("deve lançar erro se nenhum sabor for enviado", () => {
      expect(() =>
        calculateItemPrice({
          isPizza: true,
          size: sizeGrande,
          flavors: [],
          quantity: 1,
        })
      ).toThrow(/Ao menos um sabor/);
    });

    it("deve lançar erro se tamanho for omitido em pizza", () => {
      expect(() =>
        calculateItemPrice({
          isPizza: true,
          flavors: [flavorMargherita],
          quantity: 1,
        })
      ).toThrow(/tamanho de pizza válido/);
    });
  });
});
