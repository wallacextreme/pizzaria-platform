"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAdminAuthStore } from "@/store/adminAuthStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Lock, ShieldCheck, ChefHat, ArrowRight, Pizza } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAdminAuthStore();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push("/admin");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Preencha todos os campos para continuar.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      // Simulação ou login com verificação
      login(email, "admin", "Administrador");
      setLoading(false);
      router.push("/admin");
    }, 400);
  };

  const handleQuickLogin = (role: "admin" | "staff") => {
    setLoading(true);
    if (role === "admin") {
      login("admin@pizzaria.com.br", "admin", "Gerente Geral");
    } else {
      login("cozinha@pizzaria.com.br", "staff", "Pizzaiolo Chefe");
    }
    router.push("/admin");
  };


  return (
    <div className="min-h-screen bg-pizza-charcoal text-pizza-cream flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pizza-terracotta/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-pizza-terracotta flex items-center justify-center text-white shadow-lg shadow-pizza-terracotta/30 group-hover:scale-105 transition-transform">
              <Pizza className="w-5 h-5" />
            </div>
            <span className="font-serif text-2xl font-black text-pizza-cream tracking-tight">
              Pizzaria<span className="text-pizza-terracotta">.io</span>
            </span>
          </Link>
          <div className="pt-2">
            <Badge variant="outline" className="text-xs">
              Portal Operacional & Cozinha
            </Badge>
          </div>
        </div>

        <Card className="bg-pizza-charcoal-card border-pizza-border shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
              <Lock className="w-5 h-5 text-pizza-gold" />
              <span>Acesso Administrativo</span>
            </CardTitle>
            <CardDescription className="text-xs text-stone-400">
              Gerencie a cozinha, quadro Kanban e operações em tempo real.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">E-mail corporativo</label>
                <Input
                  type="email"
                  placeholder="gerente@pizzaria.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-pizza-charcoal border-pizza-border text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Senha de acesso</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-pizza-charcoal border-pizza-border text-xs"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full text-sm font-bold gap-2"
                disabled={loading}
              >
                <span>{loading ? "Autenticando..." : "Entrar no Painel"}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-pizza-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-pizza-charcoal-card px-2 text-stone-500">
                  Ou acesse com credenciais de teste
                </span>
              </div>
            </div>

            {/* Acesso Rápido para Testes e Demonstração */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleQuickLogin("admin")}
                className="text-xs gap-1.5 justify-center py-2 h-auto"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-pizza-gold shrink-0" />
                <div className="text-left">
                  <p className="font-bold">Gerente</p>
                  <p className="text-[10px] text-stone-400">Acesso Total (Admin)</p>
                </div>
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleQuickLogin("staff")}
                className="text-xs gap-1.5 justify-center py-2 h-auto"
              >
                <ChefHat className="w-3.5 h-3.5 text-pizza-terracotta shrink-0" />
                <div className="text-left">
                  <p className="font-bold">Cozinha</p>
                  <p className="text-[10px] text-stone-400">Operação (Staff)</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-stone-400 hover:text-pizza-gold transition-colors inline-flex items-center gap-1"
          >
            <span>← Voltar para o Cardápio Público</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
