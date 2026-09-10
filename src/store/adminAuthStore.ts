import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { UserRoleType, UUID } from "@/types/domain";

export interface AdminUser {
  id: UUID;
  email: string;
  name: string;
  role: UserRoleType;
}

interface AdminAuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  checkSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

export const useAdminAuthStore = create<AdminAuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  _hasHydrated: false,

  setHasHydrated: (_hasHydrated: boolean) => set({ _hasHydrated }),

  checkSession: async () => {
    set({ isLoading: true });
    try {
      // Suporte a testes automatizados de navegador (estritamente fora de produção)
      if (process.env.NODE_ENV !== "production" && typeof document !== "undefined") {
        if (document.cookie.includes("sb-test-session=admin")) {
          set({
            user: {
              id: "admin-uuid-test",
              email: "gerente@pizzaria.com.br",
              name: "Gerente Geral",
              role: "admin",
            },
            isAuthenticated: true,
            isLoading: false,
            _hasHydrated: true,
          });
          return;
        } else if (document.cookie.includes("sb-test-session=staff")) {
          set({
            user: {
              id: "staff-uuid-test",
              email: "cozinha@pizzaria.com.br",
              name: "Pizzaiolo Chefe",
              role: "staff",
            },
            isAuthenticated: true,
            isLoading: false,
            _hasHydrated: true,
          });
          return;
        }
      }

      const supabase = createClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData?.session?.user) {
        set({ user: null, isAuthenticated: false, isLoading: false, _hasHydrated: true });
        return;
      }

      const authUser = sessionData.session.user;

      // Busca o papel estrito na tabela user_roles
      const { data: roleRow, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (roleError || !roleRow) {
        // Usuário logado no Supabase mas SEM permissão em user_roles: desconecta imediatamente
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false, isLoading: false, _hasHydrated: true });
        return;
      }

      const role = roleRow.role as UserRoleType;
      const userMetaName = (authUser.user_metadata?.name as string) || (role === "admin" ? "Gerente Geral" : "Pizzaiolo Chefe");

      set({
        user: {
          id: authUser.id,
          email: authUser.email || "",
          name: userMetaName,
          role,
        },
        isAuthenticated: true,
        isLoading: false,
        _hasHydrated: true,
      });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false, _hasHydrated: true });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const supabase = createClient();

      // 1. Supabase Auth real via credenciais
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData?.user) {
        set({ isLoading: false });
        return {
          success: false,
          error: authError?.message || "Credenciais de acesso incorretas.",
        };
      }

      const authUser = authData.user;

      // 2. Consulta de autorização estrita em user_roles
      const { data: roleRow, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (roleError || !roleRow) {
        // NUNCA trata qualquer usuário autenticado como administrador
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false, isLoading: false });
        return {
          success: false,
          error: "Acesso negado: seu usuário não possui atribuição de papel administrativo em user_roles.",
        };
      }

      const role = roleRow.role as UserRoleType;
      const userMetaName =
        (authUser.user_metadata?.name as string) ||
        (role === "admin" ? "Gerente Geral" : "Pizzaiolo Chefe");

      const adminUser: AdminUser = {
        id: authUser.id,
        email: authUser.email || "",
        name: userMetaName,
        role,
      };

      set({
        user: adminUser,
        isAuthenticated: true,
        isLoading: false,
        _hasHydrated: true,
      });

      return { success: true };
    } catch (err: unknown) {
      set({ isLoading: false });
      const message = err instanceof Error ? err.message : "Erro inesperado durante autenticação.";
      return { success: false, error: message };
    }
  },

  logout: async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Falha silenciosa no signOut se cliente estiver indisponível
    } finally {
      if (typeof window !== "undefined" && window.location?.port === "3000" && typeof fetch === "function") {
        try {
          fetch("/api/auth/test-session", { method: "DELETE" }).catch(() => {});
        } catch {
          // Silencioso em ambiente de teste
        }
      }
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));

if (typeof window !== "undefined") {
  (window as unknown as { __adminAuthStore?: typeof useAdminAuthStore }).__adminAuthStore = useAdminAuthStore;
}
