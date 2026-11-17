/**
 * Barramento Client-Side de Sincronia Instantânea Multi-Abas
 *
 * Complementa o Supabase Realtime (postgres_changes) e o polling de segurança,
 * garantindo que alterações feitas no Painel Admin (pausar/criar produto, abrir/fechar
 * loja, mudar regra meio a meio ou avançar pedido no Kanban) ou novos pedidos na Loja
 * reflitam em <10ms em qualquer outra aba aberta no mesmo navegador.
 */

export type RealtimeTopic = "products" | "store_settings" | "orders";

export interface RealtimeSyncEvent {
  topic: RealtimeTopic;
  orderId?: string;
  timestamp: number;
}

const CHANNEL_NAME = "forno-massa-realtime";
const WINDOW_EVENT_NAME = "forno-massa:realtime-sync";

export function publishRealtimeSync(topic: RealtimeTopic, orderId?: string): void {
  if (typeof window === "undefined") return;

  const payload: RealtimeSyncEvent = {
    topic,
    orderId,
    timestamp: Date.now(),
  };

  try {
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage(payload);
      channel.close();
    }
  } catch {
    // Ambientes sem suporte completo a BroadcastChannel seguem via polling/Realtime
  }

  try {
    window.dispatchEvent(new CustomEvent<RealtimeSyncEvent>(WINDOW_EVENT_NAME, { detail: payload }));
  } catch {
    // Fallback silencioso
  }
}

export function subscribeRealtimeSync(
  topics: RealtimeTopic[],
  handler: (event: RealtimeSyncEvent) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const topicSet = new Set(topics);
  let channel: BroadcastChannel | null = null;

  const onWindowEvent = (ev: Event) => {
    const detail = (ev as CustomEvent<RealtimeSyncEvent>).detail;
    if (detail && topicSet.has(detail.topic)) {
      handler(detail);
    }
  };

  window.addEventListener(WINDOW_EVENT_NAME, onWindowEvent);

  try {
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (ev: MessageEvent<RealtimeSyncEvent>) => {
        if (ev.data && topicSet.has(ev.data.topic)) {
          handler(ev.data);
        }
      };
    }
  } catch {
    // Fallback silencioso
  }

  return () => {
    window.removeEventListener(WINDOW_EVENT_NAME, onWindowEvent);
    try {
      channel?.close();
    } catch {
      // Ignore
    }
  };
}
