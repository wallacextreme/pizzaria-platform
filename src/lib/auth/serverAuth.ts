/**
 * Server Authentication & RBAC Guard — Autorização Robusta em Route Handlers
 * 
 * PADRÃO DE SEGURANÇA (ADR 009):
 * - Valida a sessão do usuário através dos cookies de sessão (SSR) ou cabeçalho Authorization: Bearer.
 * - Consulta a tabela public.user_roles para verificar privilégios reais ('admin' ou 'staff').
 * - Previne escalada de privilégios e acesso anônimo em todos os endpoints administrativos.
 */

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRoleType, UUID } from "@/types/domain";

export interface AuthenticatedUserContext {
  userId: UUID;
  email: string;
  role: UserRoleType;
  isAdmin: boolean;
  isStaff: boolean;
}

export type AuthResult =
  | { success: true; user: AuthenticatedUserContext }
  | { success: false; response: NextResponse };

/**
 * Autentica o usuário da requisição e verifica seu papel em public.user_roles.
 * @param request Requisição HTTP do Next.js
 * @param requiredRole Papel mínimo exigido ('staff' para operações gerais, 'admin' para exclusivas)
 */
export async function authenticateServerRequest(
  request: Request,
  requiredRole: "staff" | "admin" = "staff"
): Promise<AuthResult> {
  try {
    // Suporte a sessões controladas de teste automatizado (estritamente fora de produção)
    if (process.env.NODE_ENV !== "production") {
      const cookieHeader = request.headers.get("cookie") || "";
      if (cookieHeader.includes("sb-test-session=admin")) {
        return {
          success: true,
          user: {
            userId: "admin-uuid-test",
            email: "gerente@pizzaria.com.br",
            role: "admin",
            isAdmin: true,
            isStaff: true,
          },
        };
      } else if (cookieHeader.includes("sb-test-session=staff")) {
        if (requiredRole === "admin") {
          return {
            success: false,
            response: NextResponse.json(
              { success: false, error: "Acesso negado: esta operação exige privilégios de Administrador Geral (admin)." },
              { status: 403 }
            ),
          };
        }
        return {
          success: true,
          user: {
            userId: "staff-uuid-test",
            email: "cozinha@pizzaria.com.br",
            role: "staff",
            isAdmin: false,
            isStaff: true,
          },
        };
      }
    }

    let token: string | null = null;
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    const supabase = await createServerSupabaseClient();
    let user = null;

    if (token) {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        user = data.user;
      }
    } else {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        user = data.user;
      }
    }

    // 1. Verificação de Sessão Ativa
    if (!user || !user.id) {
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: "Sessão não autenticada. Faça login com Supabase Auth para acessar este recurso.",
          },
          { status: 401 }
        ),
      };
    }

    // 2. Consulta de Papel em user_roles (via Service Role para contornar restrições de recursão)
    const adminSupabase = createAdminClient();
    const { data: roleRow, error: roleError } = await adminSupabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleError || !roleRow) {
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: "Acesso negado: seu usuário não possui atribuição de papel administrativo em user_roles.",
          },
          { status: 403 }
        ),
      };
    }

    const role = roleRow.role as UserRoleType;
    const isAdmin = role === "admin";
    const isStaff = role === "staff" || isAdmin;

    // 3. Verificação de Nível Exigido
    if (requiredRole === "admin" && !isAdmin) {
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: "Acesso negado: esta operação exige privilégios de Administrador Geral (admin).",
          },
          { status: 403 }
        ),
      };
    }

    if (requiredRole === "staff" && !isStaff) {
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: "Acesso negado: operação restrita a operadores da cozinha ou administradores.",
          },
          { status: 403 }
        ),
      };
    }

    return {
      success: true,
      user: {
        userId: user.id,
        email: user.email || "",
        role,
        isAdmin,
        isStaff,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Falha na verificação de autenticação.";
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: message },
        { status: 500 }
      ),
    };
  }
}
