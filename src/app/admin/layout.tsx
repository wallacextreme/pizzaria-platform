"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAdminAuthStore } from "@/store/adminAuthStore";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, _hasHydrated, isLoading, checkSession } = useAdminAuthStore();

  const isLoginPage = pathname === "/admin/login";

  React.useEffect(() => {
    if (!isLoginPage) {
      checkSession();
    }
  }, [isLoginPage, checkSession]);

  React.useEffect(() => {
    if (!isLoginPage && _hasHydrated && !isLoading && !isAuthenticated) {
      router.push("/admin/login");
    }
  }, [isLoginPage, _hasHydrated, isLoading, isAuthenticated, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Estado de verificação / carregamento
  if (!_hasHydrated || isLoading) {
    return (
      <div className="min-h-screen bg-pizza-charcoal text-pizza-cream flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 mx-auto text-pizza-terracotta animate-spin" />
          <p className="text-xs text-stone-400">Verificando credenciais e autorização...</p>
        </div>
      </div>
    );
  }

  // Não autenticado
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-pizza-charcoal text-pizza-cream flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4 p-6 rounded-2xl bg-pizza-charcoal-card border border-pizza-border">
          <ShieldAlert className="w-10 h-10 text-pizza-terracotta mx-auto" />
          <h2 className="text-lg font-bold">Acesso Restrito</h2>
          <p className="text-xs text-stone-400">
            É necessário realizar login corporativo com perfil administrativo ou de cozinha para acessar este painel.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push("/admin/login")}
            className="w-full"
          >
            Ir para a Página de Login
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
