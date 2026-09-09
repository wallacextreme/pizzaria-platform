export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-xl p-8 rounded-2xl bg-pizza-charcoal-card border border-pizza-border shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-pizza-terracotta/20 text-pizza-terracotta border border-pizza-terracotta/30 mb-6">
          <span className="w-2 h-2 rounded-full bg-pizza-terracotta animate-pulse" />
          Fase 0 Concluída — Baseline e Arquitetura 10/10
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-pizza-cream font-display mb-4 tracking-tight">
          Plataforma de Pizzaria Full-Stack
        </h1>
        <p className="text-stone-400 text-sm sm:text-base mb-6 leading-relaxed">
          Infraestrutura pronta para produção com Next.js, Supabase, RLS, Vitest e arquitetura em camadas estrita.
        </p>
        <div className="grid grid-cols-2 gap-3 text-left text-xs text-stone-300 bg-pizza-charcoal p-4 rounded-xl border border-pizza-border">
          <div>
            <span className="text-stone-500 block">Fonte da Verdade:</span>
            <span className="font-semibold text-pizza-cream">PostgreSQL / Supabase</span>
          </div>
          <div>
            <span className="text-stone-500 block">Valores Monetários:</span>
            <span className="font-semibold text-pizza-cream">Centavos Inteiros (cents)</span>
          </div>
          <div>
            <span className="text-stone-500 block">Autorização:</span>
            <span className="font-semibold text-pizza-cream">RBAC Granular (admin/staff)</span>
          </div>
          <div>
            <span className="text-stone-500 block">Testes Automatizados:</span>
            <span className="font-semibold text-pizza-cream">Vitest Unit & Integration</span>
          </div>
        </div>
      </div>
    </main>
  );
}
