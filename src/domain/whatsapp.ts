/**
 * WhatsApp Order Message Formatter — Formatação Profissional de Pedido
 * 
 * Regra de negócio pura e testável para geração de mensagem estruturada e URL encoding seguro.
 */

import type { Order } from "@/types/domain";
import { formatCentsToBRL } from "@/domain/currency";

export function formatOrderForWhatsApp(order: Order): string {
  const lines: string[] = [];

  // Cabeçalho
  lines.push("🍕 *FORNO & MASSA — PIZZARIA ARTESANAL* 🍕");
  lines.push(`*Pedido:* ${order.display_id}`);
  lines.push(`*Status:* Recebido no Sistema`);
  lines.push("────────────────────────────");

  // Dados do Cliente
  lines.push(`👤 *Cliente:* ${order.customer.name}`);
  lines.push(`📞 *WhatsApp:* ${order.customer.phone}`);
  lines.push(
    `📦 *Modalidade:* ${order.delivery_type === "delivery" ? "🛵 Delivery" : "🏪 Retirada no Balcão"}`
  );

  // Endereço (se delivery)
  if (order.delivery_type === "delivery" && order.address) {
    const addr = order.address;
    lines.push("📍 *Endereço de Entrega:*");
    lines.push(`   ${addr.street}, nº ${addr.number}${addr.complement ? ` - ${addr.complement}` : ""}`);
    lines.push(`   Bairro: ${addr.neighborhood} — ${addr.city}/${addr.state}`);
    lines.push(`   CEP: ${addr.postal_code}`);
    if (addr.reference) {
      lines.push(`   *Ref:* ${addr.reference}`);
    }
  }

  lines.push("────────────────────────────");
  lines.push("📋 *ITENS DO PEDIDO:*");

  // Lista de Itens
  order.items.forEach((item) => {
    lines.push(`\n*${item.quantity}x ${item.name}* — ${formatCentsToBRL(item.total_price_cents)}`);

    if (item.is_pizza && item.size) {
      lines.push(`   Tamanho: ${item.size.name} (${item.size.slices} fatias)`);
    }

    if (item.flavors && item.flavors.length > 1) {
      lines.push(`   Sabores: ${item.flavors.map((f) => f.name).join(" + ")}`);
    }

    if (item.crust && item.crust.price_cents > 0) {
      lines.push(`   Borda: ${item.crust.name} (+${formatCentsToBRL(item.crust.price_cents)})`);
    }

    if (item.extras && item.extras.length > 0) {
      const extrasStr = item.extras
        .map((e) => `${e.name} (+${formatCentsToBRL(e.price_cents)})`)
        .join(", ");
      lines.push(`   Extras: ${extrasStr}`);
    }

    if (item.removed_ingredients && item.removed_ingredients.length > 0) {
      lines.push(`   Sem: ${item.removed_ingredients.join(", ")}`);
    }

    if (item.notes) {
      lines.push(`   Obs: "${item.notes}"`);
    }
  });

  lines.push("\n────────────────────────────");
  // Valores Financeiros
  lines.push(`💰 *Subtotal:* ${formatCentsToBRL(order.subtotal_cents)}`);
  if (order.delivery_type === "delivery") {
    lines.push(`🛵 *Taxa de Entrega:* ${formatCentsToBRL(order.delivery_fee_cents)}`);
  }
  lines.push(`⭐ *TOTAL FINAL:* ${formatCentsToBRL(order.total_cents)}`);

  // Pagamento
  lines.push("────────────────────────────");
  const paymentLabels: Record<string, string> = {
    pix: "PIX",
    cartao: "Cartão (Máquina na entrega)",
    dinheiro: "Dinheiro",
  };
  lines.push(`💳 *Pagamento:* ${paymentLabels[order.payment_method] || order.payment_method}`);

  if (order.payment_method === "dinheiro" && order.change_for_cents) {
    const changeAmount = order.change_for_cents - order.total_cents;
    lines.push(`   Troco para: ${formatCentsToBRL(order.change_for_cents)}`);
    lines.push(`   *Levar troco:* ${formatCentsToBRL(changeAmount)}`);
  }

  lines.push("────────────────────────────");
  lines.push("Tempo estimado: 40-50 min.");
  lines.push("Obrigado por escolher a Forno & Massa!");

  return lines.join("\n");
}

/**
 * Gera o link wa.me devidamente codificado para abertura instantânea do WhatsApp.
 */
export function generateWhatsAppUrl(phone: string, message: string): string {
  // Remove caracteres não numéricos do telefone
  const cleanPhone = phone.replace(/\D/g, "");
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}
