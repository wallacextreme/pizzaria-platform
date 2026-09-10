import { NextResponse } from "next/server";

/**
 * Endpoint de Controle de Sessão Estritamente para Testes Automatizados E2E / Browser
 * DESABILITADO EM PRODUÇÃO (NODE_ENV === "production").
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const role = body.role === "staff" ? "staff" : "admin";

    const response = NextResponse.json({ success: true, role });
    response.cookies.set("sb-test-session", role, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
    });

    return response;
  } catch {
    return NextResponse.json({ success: false, error: "Payload inválido" }, { status: 400 });
  }
}

export async function DELETE() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete("sb-test-session");
  return response;
}
