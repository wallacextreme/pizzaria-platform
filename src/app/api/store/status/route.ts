import { NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { MOCK_STORE_SETTINGS } from "@/lib/mockData";
import { getStoreOperationalStatus } from "@/domain/storeHours";
import type { StoreManualOverride } from "@/types/domain";

export async function GET() {
  const currentStatus = getStoreOperationalStatus(MOCK_STORE_SETTINGS, new Date());
  return NextResponse.json({
    success: true,
    manual_override: MOCK_STORE_SETTINGS.manual_override,
    operationalStatus: currentStatus,
    settings: MOCK_STORE_SETTINGS,
  });
}

export async function POST(request: Request) {
  // Apenas administradores podem alterar o status operacional da loja
  const auth = await authenticateServerRequest(request, "admin");
  if (!auth.success) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const { manual_override } = body;

    const validOverrides: StoreManualOverride[] = ["auto", "aberto", "fechado"];
    if (!manual_override || !validOverrides.includes(manual_override)) {
      return NextResponse.json(
        {
          success: false,
          error: `Override manual inválido: "${manual_override}". Permitidos: auto, aberto, fechado.`,
        },
        { status: 400 }
      );
    }

    // Persiste alteração no singleton de configurações
    MOCK_STORE_SETTINGS.manual_override = manual_override;

    // Avalia status imediato utilizando a regra do domínio existente
    const currentStatus = getStoreOperationalStatus(MOCK_STORE_SETTINGS, new Date());

    return NextResponse.json({
      success: true,
      manual_override,
      operationalStatus: currentStatus,
      message: `Status da loja alterado para "${manual_override}" com sucesso.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao alterar status da loja.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
