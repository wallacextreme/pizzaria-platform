import { describe, it, expect } from "vitest";
import { formatCentsToBRL, parseBRLInputToCents } from "./currency";

describe("Domain Currency Utilities", () => {
  it("deve formatar centavos inteiros para moeda pt-BR corretamente", () => {
    // R$ 25,90 = 2590 centavos
    const formatted = formatCentsToBRL(2590);
    expect(formatted).toMatch(/R\$\s*25,90/);
  });

  it("deve formatar zero centavos como R$ 0,00", () => {
    const formatted = formatCentsToBRL(0);
    expect(formatted).toMatch(/R\$\s*0,00/);
  });

  it("deve formatar valores altos corretamente com separador de milhar", () => {
    const formatted = formatCentsToBRL(125000); // R$ 1.250,00
    expect(formatted).toMatch(/R\$\s*1\.250,00/);
  });

  it("deve lançar erro se receber número que não seja inteiro de centavos", () => {
    expect(() => formatCentsToBRL(25.9 as unknown as number)).toThrowError(
      /O valor monetário deve ser um número inteiro de centavos/
    );
  });

  it("deve converter string digitada para centavos inteiros", () => {
    expect(parseBRLInputToCents("R$ 25,90")).toBe(2590);
    expect(parseBRLInputToCents("100")).toBe(100);
    expect(parseBRLInputToCents("")).toBe(0);
  });
});
