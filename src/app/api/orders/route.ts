import { NextResponse } from "next/server";
import { validateAndRecalculateOrder } from "@/domain/orderValidator";
import { globalOrderRepository } from "@/repositories/mockOrderRepository";
import { MOCK_PRODUCTS, MOCK_DELIVERY_ZONES, MOCK_STORE_SETTINGS } from "@/lib/mockData";
import { ZodError } from "zod";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Recálculo total e validação no servidor (BACKEND É A FONTE DA VERDADE)
    const { order, priceTampered } = validateAndRecalculateOrder(body, {
      products: MOCK_PRODUCTS,
      deliveryZones: MOCK_DELIVERY_ZONES,
      settings: MOCK_STORE_SETTINGS,
    });

    // 2. Persistência no Repositório de Pedidos
    const savedOrder = await globalOrderRepository.create(order);

    return NextResponse.json(
      {
        success: true,
        order: savedOrder,
        priceTampered,
        message: "Pedido recebido e confirmado com sucesso no sistema!",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const issue = error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: issue ? `${issue.path.join(".")}: ${issue.message}` : "Dados de pedido inválidos.",
        },
        { status: 422 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Erro inesperado ao processar o pedido.",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const displayId = searchParams.get("display_id");

  if (!id && !displayId) {
    // Retorna os últimos pedidos
    const orders = await globalOrderRepository.listAll(20);
    return NextResponse.json({ success: true, orders });
  }

  const order = id
    ? await globalOrderRepository.findById(id)
    : await globalOrderRepository.findByDisplayId(displayId!);

  if (!order) {
    return NextResponse.json(
      {
        success: false,
        error: "Pedido não encontrado.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, order });
}
