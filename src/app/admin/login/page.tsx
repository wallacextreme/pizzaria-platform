"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAdminAuthStore } from "@/store/adminAuthStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Lock, ArrowRight, Pizza, AlertCircle, ShieldCheck, ChefHat } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, checkSession } = useAdminAuthStore();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const isDemoAccessAvailable = process.env.NODE_ENV !== "production";

  React.useEffect(() => {
    checkSession();
  }, [checkSession]);

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push("/admin");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Preencha todos os campos para continuar.");
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      router.push("/admin");
    } else {
      setError(result.error || "Falha na autenticação administrativa.");
    }
  };

  const handleQuickDemoSession = async (role: "admin" | "staff") => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/test-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (!res.ok) {
        setError("Sessão rápida indisponível neste ambiente.");
        setLoading(false);
        return;
      }

      await checkSession();
      router.push("/admin");
    } catch {
      setError("Erro ao iniciar sessão de homologação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pizza-charcoal text-pizza-cream flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Glow de fundo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pizza-terracotta/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Identidade Visual */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-pizza-terracotta flex items-center justify-center text-white shadow-lg shadow-pizza-terracotta/30 group-hover:scale-105 transition-transform">
              <Pizza className="w-5 h-5" />
            </div>
            <span className="font-serif text-2xl font-black text-pizza-cream tracking-tight">
              Forno &amp; Massa
            </span>
          </Link>
          <div className="pt-2">
            <Badge variant="outline" className="text-xs">
              Portal Operacional &amp; Cozinha
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
              Autenticação segura via Supabase Auth e controle de permissões por perfil (RBAC).
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="admin-email" className="text-xs font-semibold text-stone-300">
                  E-mail corporativo
                </label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="operador@pizzaria.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-pizza-charcoal border-pizza-border text-xs"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="admin-password" className="text-xs font-semibold text-stone-300">
                  Senha de acesso
                </label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-pizza-charcoal border-pizza-border text-xs"
                  required
                  autoComplete="current-password"
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

            {/* Acesso Rápido de Homologação (Exclusivo fora de produção) */}
            {isDemoAccessAvailable && (
              <div className="pt-4 border-t border-pizza-border space-y-2.5">
                <p className="text-[11px] font-semibold text-stone-400 text-center">
                  Acesso Rápido de Homologação (Ambiente Local)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={loading}
                    onClick={() => handleQuickDemoSession("admin")}
                    className="text-xs font-bold gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-pizza-gold" />
                    <span>Gerente (Admin)</span>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={loading}
                    onClick={() => handleQuickDemoSession("staff")}
                    className="text-xs font-bold gap-1.5"
                  >
                    <ChefHat className="w-3.5 h-3.5 text-pizza-terracotta" />
                    <span>Cozinha (Staff)</span>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-2 text-center">
          <Link
            href="/demo"
            className="text-xs font-semibold text-pizza-gold hover:text-amber-300 transition-colors inline-flex items-center gap-1.5"
          >
            <span>Explorar Demo Sandbox Interativa (Sem Login) →</span>
          </Link>
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
