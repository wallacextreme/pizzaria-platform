/**
 * Order Reconciliation & Deduplication — Resolução Determinística Realtime vs Polling
 * 
 * PADRÃO DE ARQUITETURA (ADR 008):
 * - Realtime é o mecanismo principal de baixa latência para INSERTs e UPDATEs.
 * - Polling (10s) atua estritamente como resync/fallback caso o WebSocket oscile ou perca pacotes.
 * - Toda mesclagem é idempotente e baseada em carimbos temporais (updated_at).
 * - Previne duplicação de pedidos, inversão de estados concorrentes e race conditions.
 */

import type { Order } from "@/types/domain";

export interface ReconciliationResult {
  orders: Order[];
  hasNewIncomingOrder: boolean;
  updatedOrderIds: string[];
}

/**
 * Normaliza carimbo de data/hora para milissegundos, com tolerância a formatos diversos.
 */
function getTimestampMs(dateString: string | undefined): number {
  if (!dateString) return 0;
  const time = new Date(dateString).getTime();
  return isNaN(time) ? 0 : time;
}

/**
 * Reconcilia de forma pura e determinística uma lista existente de pedidos com
 * um ou múltiplos pedidos recebidos (via Realtime ou Polling).
 * 
 * @param currentOrders Lista atual presente no estado da aplicação
 * @param incoming Um pedido (evento Realtime) ou array de pedidos (payload de Polling)
 */
export function reconcileOrders(
  currentOrders: Order[],
  incoming: Order | Order[]
): ReconciliationResult {
  const incomingList = Array.isArray(incoming) ? incoming : [incoming];
  if (incomingList.length === 0) {
    return {
      orders: [...currentOrders],
      hasNewIncomingOrder: false,
      updatedOrderIds: [],
    };
  }

  const orderMap = new Map<string, Order>();
  for (const o of currentOrders) {
    orderMap.set(o.id, o);
  }

  let hasNewIncomingOrder = false;
  const updatedOrderIds: string[] = [];

  for (const inc of incomingList) {
    if (!inc || !inc.id) continue;

    const existing = orderMap.get(inc.id);

    if (!existing) {
      // Pedido novo: adiciona ao mapa
      orderMap.set(inc.id, inc);
      updatedOrderIds.push(inc.id);
      if (inc.status === "novo") {
        hasNewIncomingOrder = true;
      }
    } else {
      // Pedido já existe: resolve conflito via updated_at
      const incTime = getTimestampMs(inc.updated_at);
      const existingTime = getTimestampMs(existing.updated_at);

      if (incTime >= existingTime) {
        // Payload mais recente ou simultâneo: aplica atualização
        orderMap.set(inc.id, inc);
        if (existing.status !== inc.status) {
          updatedOrderIds.push(inc.id);
        }
      } else {
        // Payload obsoleto (ex: polling antigo respondendo depois de um Realtime recente): DESCARTA
      }
    }
  }

  // Ordena por data de criação decrescente (pedidos mais novos primeiro)
  const sortedOrders = Array.from(orderMap.values()).sort((a, b) => {
    const timeA = getTimestampMs(a.created_at);
    const timeB = getTimestampMs(b.created_at);
    return timeB - timeA;
  });

  return {
    orders: sortedOrders,
    hasNewIncomingOrder,
    updatedOrderIds,
  };
}
