/**
 * Dashboard Metrics Domain — Definição Única de Negócio para Métricas Operacionais
 * 
 * PADRÃO DE NEGÓCIO:
 * - Faturamento do dia: soma de total_cents de pedidos do dia atual que NÃO estejam cancelados.
 * - Pedidos do dia: contagem total de pedidos válidos (não cancelados) criados no dia de referência.
 * - Pedidos em andamento: pedidos com status ativo no fluxo ['novo', 'em_preparo', 'no_forno', 'saiu_para_entrega'].
 * - Ticket Médio: faturamento_do_dia / pedidos_do_dia (arredondado para centavos inteiros).
 * - Imutabilidade: centavos inteiros no domínio, zero ponto flutuante.
 */

import type { Order, OrderStatus } from "@/types/domain";

export interface DashboardMetrics {
  revenueOfDayCents: number;
  ordersOfDayCount: number;
  inProgressCount: number;
  averageTicketCents: number;
  totalReceivedCount: number;
  cancelledCount: number;
}

export const IN_PROGRESS_STATUSES: readonly OrderStatus[] = [
  "novo",
  "em_preparo",
  "no_forno",
  "saiu_para_entrega",
] as const;

/**
 * Verifica se um pedido foi criado na mesma data civil que a data de referência.
 */
export function isSameCivilDay(dateA: Date, dateB: Date): boolean {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

/**
 * Calcula as métricas operacionais a partir de uma lista de pedidos e uma data de referência.
 * @param orders Lista completa de pedidos
 * @param referenceDate Data de corte/referência (default: now)
 * @param filterByDay Se true (default), considera apenas pedidos criados no mesmo dia da data de referência.
 */
export function calculateDailyMetrics(
  orders: Order[],
  options?: {
    referenceDate?: Date;
    filterByDay?: boolean;
  }
): DashboardMetrics {
  const referenceDate = options?.referenceDate || new Date();
  const filterByDay = options?.filterByDay ?? false; // default false se a lista já for a do dia ou do turno

  const relevantOrders = filterByDay
    ? orders.filter((o) => isSameCivilDay(new Date(o.created_at), referenceDate))
    : orders;

  let revenueOfDayCents = 0;
  let ordersOfDayCount = 0;
  let inProgressCount = 0;
  let cancelledCount = 0;

  for (const order of relevantOrders) {
    if (order.status === "cancelado") {
      cancelledCount += 1;
      continue;
    }

    // Pedido válido (não cancelado) entra no faturamento e total
    revenueOfDayCents += order.total_cents;
    ordersOfDayCount += 1;

    // Em andamento
    if (IN_PROGRESS_STATUSES.includes(order.status)) {
      inProgressCount += 1;
    }
  }

  // Se filterByDay for false, pedidos em andamento podem vir de todos os pedidos passados
  if (filterByDay) {
    // Também conta em andamento fora da virada caso haja
    inProgressCount = orders.filter(
      (o) => o.status !== "cancelado" && IN_PROGRESS_STATUSES.includes(o.status)
    ).length;
  }

  const averageTicketCents =
    ordersOfDayCount > 0 ? Math.round(revenueOfDayCents / ordersOfDayCount) : 0;

  return {
    revenueOfDayCents,
    ordersOfDayCount,
    inProgressCount,
    averageTicketCents,
    totalReceivedCount: relevantOrders.length,
    cancelledCount,
  };
}
