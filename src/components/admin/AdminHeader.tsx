"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminAuthStore } from "@/store/adminAuthStore";
import { Badge } from "@/components/ui/Badge";
import { audioNotifier } from "@/lib/audioNotifier";
import {
  Pizza,
  LogOut,
  ExternalLink,
  Volume2,
  VolumeX,
  ShieldCheck,
  ChefHat,
} from "lucide-react";

interface AdminHeaderProps {
  activeTab: "kanban" | "cardapio";
  onTabChange: (tab: "kanban" | "cardapio") => void;
}

export function AdminHeader({ activeTab, onTabChange }: AdminHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAdminAuthStore();
  const [isMuted, setIsMuted] = React.useState(audioNotifier.getIsMuted());

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  const handleToggleMute = () => {
    const muted = audioNotifier.toggleMute();
    setIsMuted(muted);
  };

  const isAdmin = user?.role === "admin";

  return (
    <header className="sticky top-0 z-40 bg-pizza-charcoal/95 backdrop-blur-md border-b border-pizza-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo & Sub-marca */}
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-pizza-terracotta flex items-center justify-center text-white shadow-md shadow-pizza-terracotta/20 group-hover:scale-105 transition-transform">
              <Pizza className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <span className="font-serif font-black text-lg text-pizza-cream leading-none tracking-tight">
                Pizzaria<span className="text-pizza-terracotta">.io</span>
              </span>
              <p className="text-[10px] text-pizza-gold font-bold uppercase tracking-wider">
                Painel da Cozinha
              </p>
            </div>
          </Link>

          {/* Abas de Navegação */}
          <nav className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => onTabChange("kanban")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "kanban"
                  ? "bg-pizza-terracotta text-white shadow"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              Quadro Kanban
            </button>
            <button
              type="button"
              onClick={() => onTabChange("cardapio")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "cardapio"
                  ? "bg-pizza-terracotta text-white shadow"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              Operação & Loja
            </button>
          </nav>
        </div>

        {/* Controles da Direita */}
        <div className="flex items-center gap-3">
          {/* Toggle de Áudio Rápido */}
          <button
            type="button"
            onClick={handleToggleMute}
            className={`p-2 rounded-xl border transition-colors ${
              isMuted
                ? "bg-red-950/30 border-red-500/30 text-red-400"
                : "bg-black/30 border-white/10 text-pizza-gold hover:text-white"
            }`}
            title={isMuted ? "Alertas sonoros mutados" : "Alertas sonoros ativos"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Ver Cardápio Público */}
          <Link
            href="/"
            target="_blank"
            className="hidden md:inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-pizza-gold transition-colors py-1.5 px-2.5 rounded-xl border border-white/5 hover:border-white/10"
            title="Abrir cardápio do cliente em nova aba"
          >
            <span>Ver Cardápio</span>
            <ExternalLink className="w-3 h-3" />
          </Link>

          {/* Dados do Usuário */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-pizza-cream leading-tight">
                {user?.name || "Operador"}
              </p>
              <p className="text-[10px] text-stone-400">
                {user?.email || "operacao@pizzaria.com.br"}
              </p>
            </div>

            <Badge
              variant={isAdmin ? "warning" : "terracotta"}
              className="text-[10px] font-bold uppercase gap-1"
            >

              {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <ChefHat className="w-3 h-3" />}
              <span>{isAdmin ? "Admin" : "Cozinha"}</span>
            </Badge>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-stone-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
              title="Sair do painel administrativo"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
