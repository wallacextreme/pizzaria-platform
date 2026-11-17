import { NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { getCatalogStore } from "@/lib/mockData";
import { getStoreOperationalStatus } from "@/domain/storeHours";
import type { HalfAndHalfRule, StoreManualOverride } from "@/types/domain";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET() {
  const store = getCatalogStore();
  const currentStatus = getStoreOperationalStatus(store.storeSettings, new Date());
  return NextResponse.json(
    {
      success: true,
      manual_override: store.storeSettings.manual_override,
      half_and_half_pricing_rule: store.storeSettings.half_and_half_pricing_rule,
      operationalStatus: currentStatus,
      settings: store.storeSettings,
      deliveryZones: store.deliveryZones,
    },
    { headers: NO_STORE_HEADERS }
  );
}

export async function POST(request: Request) {
  // Apenas administradores podem alterar configurações operacionais da loja
  const auth = await authenticateServerRequest(request, "admin");
  if (!auth.success) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const store = getCatalogStore();
    const { manual_override, half_and_half_pricing_rule, delivery_zone } = body;

    if (
      manual_override === undefined &&
      half_and_half_pricing_rule === undefined &&
      delivery_zone === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Nenhuma alteração válida foi informada.",
        },
        { status: 400 }
      );
    }

    if (manual_override !== undefined) {
      const validOverrides: StoreManualOverride[] = ["auto", "aberto", "fechado"];
      if (!validOverrides.includes(manual_override)) {
        return NextResponse.json(
          {
            success: false,
            error: `Override manual inválido: "${manual_override}". Permitidos: auto, aberto, fechado.`,
          },
          { status: 400 }
        );
      }
      store.storeSettings.manual_override = manual_override;
    }

    if (half_and_half_pricing_rule !== undefined) {
      const validRules: HalfAndHalfRule[] = ["maior_valor", "media_ponderada"];
      if (!validRules.includes(half_and_half_pricing_rule)) {
        return NextResponse.json(
          {
            success: false,
            error: `Regra meio a meio inválida: "${half_and_half_pricing_rule}".`,
          },
          { status: 400 }
        );
      }
      store.storeSettings.half_and_half_pricing_rule = half_and_half_pricing_rule;
    }

    if (delivery_zone !== undefined) {
      const { id, fee_cents, estimated_time_minutes } = delivery_zone || {};
      const targetZone = store.deliveryZones.find((z) => z.id === id);
      if (!targetZone) {
        return NextResponse.json(
          { success: false, error: `Zona de entrega "${id}" não encontrada.` },
          { status: 404 }
        );
      }
      if (!Number.isInteger(fee_cents) || fee_cents < 0 || !Number.isInteger(estimated_time_minutes) || estimated_time_minutes <= 0) {
        return NextResponse.json(
          { success: false, error: "Taxa e tempo estimado inválidos para a zona de entrega." },
          { status: 400 }
        );
      }
      targetZone.fee_cents = fee_cents;
      targetZone.estimated_time_minutes = estimated_time_minutes;
      targetZone.updated_at = new Date().toISOString();
    }

    const currentStatus = getStoreOperationalStatus(store.storeSettings, new Date());

    return NextResponse.json({
      success: true,
      manual_override: store.storeSettings.manual_override,
      half_and_half_pricing_rule: store.storeSettings.half_and_half_pricing_rule,
      operationalStatus: currentStatus,
      settings: store.storeSettings,
      deliveryZones: store.deliveryZones,
      message: "Configurações operacionais atualizadas com sucesso.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao alterar configurações da loja.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
