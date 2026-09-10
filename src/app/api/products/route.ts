import { NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { MOCK_PRODUCTS } from "@/lib/mockData";

export async function GET() {
  return NextResponse.json({
    success: true,
    products: MOCK_PRODUCTS,
  });
}

export async function PATCH(request: Request) {
  // 1. Apenas administradores podem pausar ou reativar produtos
  const auth = await authenticateServerRequest(request, "admin");
  if (!auth.success) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const { id, is_active } = body;

    if (!id || typeof is_active !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          error: 'Parâmetros inválidos. É obrigatório fornecer "id" (string) e "is_active" (boolean).',
        },
        { status: 400 }
      );
    }

    const product = MOCK_PRODUCTS.find((p) => p.id === id);
    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: `Produto com id "${id}" não encontrado.`,
        },
        { status: 404 }
      );
    }

    // Atualiza o estado persistido do produto
    product.is_active = is_active;
    product.updated_at = new Date().toISOString();

    return NextResponse.json({
      success: true,
      product,
      message: `Produto "${product.name}" ${is_active ? "reativado" : "pausado"} com sucesso.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao alterar status do produto.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
