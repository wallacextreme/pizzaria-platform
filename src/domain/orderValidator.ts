/**
 * Server Order Validator & Recalculation Engine
 * 
 * REGRA FUNDAMENTAL: BACKEND É A FONTE DA VERDADE.
 * - O cliente envia intenção (produtos selecionados, opções, endereço).
 * - O servidor carrega os dados reais, confirma status ativo, recalcula
 *   todos os preços em centavos, valida a taxa de entrega e decide o total.
 * - Preços enviados pelo cliente são sumariamente ignorados.
 */

import { z } from "zod";
import type { Order, OrderItem, Product, DeliveryZone, StoreSettings } from "@/types/domain";
import { calculateItemPrice } from "@/domain/pricing";

export const CreateOrderItemSchema = z.object({
  product_id: z.string().min(1, "ID do produto é obrigatório"),
  is_pizza: z.boolean(),
  size_id: z.string().optional(),
  flavor_ids: z.array(z.string()).default([]),
  crust_id: z.string().optional(),
  extra_ids: z.array(z.string()).default([]),
  removed_ingredients: z.array(z.string()).default([]),
  notes: z.string().max(250).optional(),
  quantity: z.number().int().positive("A quantidade deve ser um inteiro maior que zero"),
  // Preços enviados pelo cliente são capturados apenas para auditoria de tentativa de fraude, nunca usados para totalizar
  client_declared_total_cents: z.number().int().optional(),
});

export const CreateOrderPayloadSchema = z.object({
  customer: z.object({
    name: z.string().min(2, "Nome do cliente deve ter ao menos 2 caracteres").max(100),
    phone: z.string().min(10, "Telefone inválido").max(20),
  }),
  delivery_type: z.enum(["delivery", "retirada"]),
  address: z
    .object({
      street: z.string().min(2, "Rua é obrigatória"),
      number: z.string().min(1, "Número é obrigatório"),
      complement: z.string().max(50).optional(),
      neighborhood: z.string().min(2, "Bairro é obrigatório"),
      city: z.string().min(2, "Cidade é obrigatória"),
      state: z.string().min(2, "Estado é obrigatório"),
      postal_code: z.string().min(8, "CEP é obrigatório"),
      reference: z.string().max(150).optional(),
    })
    .optional(),
  items: z.array(CreateOrderItemSchema).min(1, "O pedido deve conter ao menos um item"),
  payment_method: z.enum(["pix", "cartao", "dinheiro"]),
  change_for_cents: z.number().int().positive().optional(),
  fulfillment_channel: z.enum(["web", "whatsapp"]).default("web"),
});

export type CreateOrderPayload = z.infer<typeof CreateOrderPayloadSchema>;

export interface OrderValidationContext {
  products: Product[];
  deliveryZones: DeliveryZone[];
  settings: StoreSettings;
}

export interface RecalculatedOrderResult {
  order: Order;
  priceTampered: boolean;
}

/**
 * Valida o payload e recalcula integralmente todos os preços no servidor.
 */
export function validateAndRecalculateOrder(
  payload: unknown,
  context: OrderValidationContext
): RecalculatedOrderResult {
  // 1. Validação Estrutural com Zod
  const parsed = CreateOrderPayloadSchema.parse(payload);

  // 2. Validação de Endereço em Delivery
  if (parsed.delivery_type === "delivery" && !parsed.address) {
    throw new Error("Endereço completo é obrigatório para modalidade de entrega (delivery).");
  }

  // 3. Recálculo dos Itens a partir da Fonte da Verdade (Produtos do Banco)
  const recalculatedItems: OrderItem[] = [];
  let recalculatedSubtotalCents = 0;
  let priceTampered = false;

  for (const rawItem of parsed.items) {
    // Carrega produto autoritativo do banco
    const product = context.products.find((p) => p.id === rawItem.product_id);
    if (!product) {
      throw new Error(`Produto com ID "${rawItem.product_id}" não encontrado.`);
    }

    if (!product.is_active) {
      throw new Error(`O produto "${product.name}" está indisponível no momento.`);
    }

    if (product.flags.is_pizza) {
      // Validações de Pizza
      if (!rawItem.size_id) {
        throw new Error(`Tamanho é obrigatório para a pizza "${product.name}".`);
      }

      const size = product.sizes.find((s) => s.id === rawItem.size_id);
      if (!size) {
        throw new Error(`Tamanho inválido para a pizza "${product.name}".`);
      }

      // Valida Sabores (1 ou 2)
      const flavorIds = rawItem.flavor_ids.length > 0 ? rawItem.flavor_ids : [product.id];
      if (flavorIds.length > size.max_flavors) {
        throw new Error(
          `O tamanho "${size.name}" permite no máximo ${size.max_flavors} sabor(es).`
        );
      }

      const flavors = flavorIds.map((fId) => {
        const flavorProd = context.products.find((p) => p.id === fId);
        if (!flavorProd || !flavorProd.is_active) {
          throw new Error(`Sabor "${fId}" indisponível ou inexistente.`);
        }
        const sizeConfig = flavorProd.sizes.find((s) => s.id === size.id);
        const flavorPriceCents = sizeConfig ? sizeConfig.price_cents : flavorProd.sizes[0]?.price_cents || 0;

        return {
          product_id: flavorProd.id,
          name: flavorProd.name,
          price_cents: flavorPriceCents,
        };
      });

      // Valida Borda
      const crust = rawItem.crust_id
        ? product.crust_options.find((c) => c.id === rawItem.crust_id)
        : undefined;

      // Valida Extras
      const extras = rawItem.extra_ids.map((eId) => {
        const extra = product.extras.find((e) => e.id === eId);
        if (!extra) {
          throw new Error(`Adicional "${eId}" não encontrado.`);
        }
        return extra;
      });

      // Recalcula Preço Unitário via Motor de Domínio Autoritativo
      const priceResult = calculateItemPrice({
        isPizza: true,
        size,
        flavors,
        crust,
        extras,
        quantity: rawItem.quantity,
        halfAndHalfRule: context.settings.half_and_half_pricing_rule,
      });

      // Detecta Adulteração de Preço pelo Cliente
      if (
        rawItem.client_declared_total_cents !== undefined &&
        rawItem.client_declared_total_cents !== priceResult.totalPriceCents
      ) {
        priceTampered = true;
      }

      const orderItem: OrderItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        product_id: product.id,
        name:
          flavors.length > 1
            ? `1/2 ${flavors[0]?.name} + 1/2 ${flavors[1]?.name}`
            : product.name,
        is_pizza: true,
        size,
        flavors,
        crust,
        extras,
        removed_ingredients: rawItem.removed_ingredients,
        notes: rawItem.notes,
        unit_price_cents: priceResult.unitPriceCents,
        quantity: rawItem.quantity,
        total_price_cents: priceResult.totalPriceCents,
      };

      recalculatedItems.push(orderItem);
      recalculatedSubtotalCents += priceResult.totalPriceCents;
    } else {
      // Itens Regulares (Bebidas, Sobremesas)
      const basePriceCents = product.sizes[0]?.price_cents || 0;
      const priceResult = calculateItemPrice({
        isPizza: false,
        basePriceCents,
        quantity: rawItem.quantity,
      });

      if (
        rawItem.client_declared_total_cents !== undefined &&
        rawItem.client_declared_total_cents !== priceResult.totalPriceCents
      ) {
        priceTampered = true;
      }

      const orderItem: OrderItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        product_id: product.id,
        name: product.name,
        is_pizza: false,
        flavors: [],
        extras: [],
        removed_ingredients: [],
        unit_price_cents: priceResult.unitPriceCents,
        quantity: rawItem.quantity,
        total_price_cents: priceResult.totalPriceCents,
      };

      recalculatedItems.push(orderItem);
      recalculatedSubtotalCents += priceResult.totalPriceCents;
    }
  }

  // 4. Cálculo Autoritativo da Taxa de Entrega
  let deliveryFeeCents = 0;
  if (parsed.delivery_type === "delivery" && parsed.address) {
    const neighborhood = parsed.address.neighborhood.trim().toLowerCase();
    const zone = context.deliveryZones.find(
      (z) => z.active && z.neighborhood.trim().toLowerCase() === neighborhood
    );

    if (!zone) {
      // Fallback para taxa padrão se o bairro não estiver explicitamente mapeado
      deliveryFeeCents = 800; // Taxa padrão R$ 8,00
    } else {
      deliveryFeeCents = zone.fee_cents;
    }
  }

  // 5. Total Geral
  const totalCents = recalculatedSubtotalCents + deliveryFeeCents;

  // 6. Validação de Troco para Dinheiro
  if (parsed.payment_method === "dinheiro" && parsed.change_for_cents !== undefined) {
    if (parsed.change_for_cents < totalCents) {
      throw new Error(
        `Valor para troco inválido (R$ ${(parsed.change_for_cents / 100).toFixed(2)}). O valor deve ser maior ou igual ao total do pedido (R$ ${(totalCents / 100).toFixed(2)}).`
      );
    }
  }

  // 7. Geração de Identificadores
  const orderId = crypto.randomUUID ? crypto.randomUUID() : `ord-${Date.now()}`;
  const displayId = `#PZ-${Math.floor(1000 + Math.random() * 9000)}`;

  const order: Order = {
    id: orderId,
    display_id: displayId,
    status: "novo",
    customer: parsed.customer,
    delivery_type: parsed.delivery_type,
    address: parsed.address,
    items: recalculatedItems,
    payment_method: parsed.payment_method,
    change_for_cents: parsed.change_for_cents,
    delivery_fee_cents: deliveryFeeCents,
    subtotal_cents: recalculatedSubtotalCents,
    total_cents: totalCents,
    fulfillment_channel: parsed.fulfillment_channel,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return {
    order,
    priceTampered,
  };
}
