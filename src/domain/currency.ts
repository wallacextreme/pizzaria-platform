/**
 * Currency Utilities — Formatação e Operações Monetárias Estritas
 * 
 * Regra: Todos os cálculos permanecem em inteiros (cents).
 * Apenas na exibição convertemos para a representação em Real brasileiro (pt-BR).
 */

export function formatCentsToBRL(cents: number): string {
  if (!Number.isInteger(cents)) {
    throw new Error(`O valor monetário deve ser um número inteiro de centavos. Recebido: ${cents}`);
  }

  const realValue = cents / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(realValue);
}

export function parseBRLInputToCents(raw: string): number {
  // Remove todos os caracteres não numéricos
  const cleaned = raw.replace(/\D/g, "");
  if (!cleaned) return 0;
  return parseInt(cleaned, 10);
}
