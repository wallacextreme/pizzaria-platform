import { describe, it, expect } from "vitest";
import { formatOrderForWhatsApp, generateWhatsAppUrl } from "./whatsapp";
import type { Order } from "@/types/domain";

describe("WhatsApp Formatter Domain Suite", () => {
  const mockDeliveryOrder: Order = {
    id: "ord-1",
    display_id: "#PZ-1042",
    status: "novo",
    customer: {
      name: "Carlos Eduardo",
      phone: "11988887777",
    },
    delivery_type: "delivery",
    address: {
      street: "Rua das Camélias",
      number: "250",
      complement: "Apto 12",
      neighborhood: "Vila Gastronômica",
      city: "São Paulo",
      state: "SP",
      postal_code: "04567-000",
      reference: "Portão cinza",
    },
    items: [
      {
        id: "item-1",
        product_id: "prod-margherita",
        name: "1/2 Margherita Especial + 1/2 Calabresa Artesanal",
        is_pizza: true,
        size: {
          id: "size-grande",
          name: "Grande",
          price_cents: 7200,
          slices: 8,
          max_flavors: 2,
        },
        flavors: [
          { product_id: "prod-margherita", name: "Margherita Especial", price_cents: 7200 },
          { product_id: "prod-calabresa", name: "Calabresa Artesanal", price_cents: 6800 },
        ],
        crust: {
          id: "crust-catupiry",
          name: "Borda Catupiry",
          price_cents: 1200,
        },
        extras: [
          { id: "extra-bacon", name: "Bacon Crocante", price_cents: 800 },
        ],
        removed_ingredients: ["manjericão"],
        notes: "Massa bem assada",
        unit_price_cents: 9200, // 7200 + 1200 + 800
        quantity: 1,
        total_price_cents: 9200,
      },
    ],
    payment_method: "dinheiro",
    change_for_cents: 10000, // R$ 100,00
    delivery_fee_cents: 500,  // R$ 5,00
    subtotal_cents: 9200,
    total_cents: 9700,        // 9200 + 500 = R$ 97,00
    fulfillment_channel: "whatsapp",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it("deve gerar mensagem estruturada contendo dados do cliente, endereço e itens", () => {
    const message = formatOrderForWhatsApp(mockDeliveryOrder);

    expect(message).toContain("#PZ-1042");
    expect(message).toContain("Carlos Eduardo");
    expect(message).toContain("Rua das Camélias, nº 250 - Apto 12");
    expect(message).toContain("Vila Gastronômica");
    expect(message).toContain("1/2 Margherita Especial + 1/2 Calabresa Artesanal");
    expect(message).toContain("Borda: Borda Catupiry");
    expect(message).toContain("Bacon Crocante");
    expect(message).toContain("Sem: manjericão");
    expect(message).toContain("Massa bem assada");
    expect(message).toMatch(/Taxa de Entrega:.*R\$\s*5,00/);
    expect(message).toMatch(/TOTAL FINAL:.*R\$\s*97,00/);
    expect(message).toMatch(/Levar troco:.*R\$\s*3,00/); // 100 - 97 = 3
  });

  it("deve omitir endereço quando o pedido for de retirada", () => {
    const pickupOrder: Order = {
      ...mockDeliveryOrder,
      delivery_type: "retirada",
      address: undefined,
      delivery_fee_cents: 0,
      total_cents: 9200,
      payment_method: "pix",
      change_for_cents: undefined,
    };

    const message = formatOrderForWhatsApp(pickupOrder);

    expect(message).toContain("🏪 Retirada no Balcão");
    expect(message).not.toContain("Endereço de Entrega");
    expect(message).not.toContain("Taxa de Entrega");
    expect(message).toContain("*Pagamento:* PIX");
  });

  it("deve gerar URL do WhatsApp devidamente codificada", () => {
    const phone = "(11) 99999-9999";
    const msg = "Olá, meu pedido #PZ-1042";
    const url = generateWhatsAppUrl(phone, msg);

    expect(url).toBe("https://wa.me/11999999999?text=Ol%C3%A1%2C%20meu%20pedido%20%23PZ-1042");
  });
});
