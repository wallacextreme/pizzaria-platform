import { NextResponse } from "next/server";
import { validateAndRecalculateOrder } from "@/domain/orderValidator";
import { globalOrderRepository } from "@/repositories/mockOrderRepository";
import { MOCK_PRODUCTS, MOCK_DELIVERY_ZONES, MOCK_STORE_SETTINGS } from "@/lib/mockData";
import { validateStatusTransition } from "@/domain/orderTransitions";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import type { OrderStatus } from "@/types/domain";
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

  // Se id ou display_id for informado, é consulta individual (ex: tracking do cliente em /pedido/[id])
  if (id || displayId) {
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

  // Listagem geral de pedidos é RESTRITA a staff ou admin
  const auth = await authenticateServerRequest(request, "staff");
  if (!auth.success) {
    return auth.response;
  }

  const orders = await globalOrderRepository.listAll(50);
  return NextResponse.json({ success: true, orders });
}

export async function PATCH(request: Request) {
  // 1. Autorização estrita no servidor (staff ou admin)
  const auth = await authenticateServerRequest(request, "staff");
  if (!auth.success) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, error: "ID do pedido é obrigatório." },
        { status: 400 }
      );
    }

    const currentOrder = await globalOrderRepository.findById(id);
    if (!currentOrder) {
      return NextResponse.json(
        { success: false, error: `Pedido "${id}" não encontrado.` },
        { status: 404 }
      );
    }

    // 2. Validação estrita da máquina de estados (orderTransitions)
    const validation = validateStatusTransition(currentOrder.status, status as OrderStatus);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error || "Transição de status inválida.",
        },
        { status: 400 }
      );
    }

    // 3. Atualização de status persistida
    const updatedOrder = await globalOrderRepository.updateStatus(id, status as OrderStatus);

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar pedido.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
