/**
 * Order Status Transitions — Validação de Transições de Estado de Pedidos
 * 
 * REGRA DE NEGÓCIO E SEGURANÇA:
 * O fluxo de pedidos é estritamente controlado e sequencial:
 * novo -> em_preparo -> no_forno -> saiu_para_entrega -> concluido
 * 
 * Cancelamento é permitido enquanto o pedido não estiver concluído.
 * Pedidos 'concluido' ou já 'cancelado' são imutáveis.
 * Retrocessos e saltos arbitrários de etapas são expressamente proibidos.
 */

import type { OrderStatus } from "@/types/domain";

export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  novo: ["em_preparo", "cancelado"],
  em_preparo: ["no_forno", "cancelado"],
  no_forno: ["saiu_para_entrega", "cancelado"],
  saiu_para_entrega: ["concluido", "cancelado"],
  concluido: [],
  cancelado: [],
} as const;

export interface TransitionValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Valida se uma transição de status é permitida pelo motor de regras da pizzaria.
 */
export function validateStatusTransition(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus
): TransitionValidationResult {
  if (currentStatus === targetStatus) {
    return {
      isValid: false,
      error: `O pedido já se encontra no status "${currentStatus}".`,
    };
  }

  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus];

  if (!allowed || !allowed.includes(targetStatus)) {
    if (currentStatus === "concluido") {
      return {
        isValid: false,
        error: "Pedidos concluídos são definitivos e não podem ter seu status alterado.",
      };
    }

    if (currentStatus === "cancelado") {
      return {
        isValid: false,
        error: "Pedidos cancelados não podem ser reabertos ou alterados.",
      };
    }

    return {
      isValid: false,
      error: `Transição inválida: não é permitido alterar status de "${currentStatus}" para "${targetStatus}".`,
    };
  }

  return { isValid: true };
}

/**
 * Retorna se a transição é válida (boolean).
 */
export function isValidStatusTransition(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus
): boolean {
  return validateStatusTransition(currentStatus, targetStatus).isValid;
}

/**
 * Retorna o próximo status válido padrão no fluxo de produção da cozinha.
 */
export function getNextFlowStatus(currentStatus: OrderStatus): OrderStatus | null {
  switch (currentStatus) {
    case "novo":
      return "em_preparo";
    case "em_preparo":
      return "no_forno";
    case "no_forno":
      return "saiu_para_entrega";
    case "saiu_para_entrega":
      return "concluido";
    default:
      return null;
  }
}
