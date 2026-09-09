import * as React from "react";
import { Flame, Phone, MapPin, Clock, Heart } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export function Footer() {
  return (
    <footer className="w-full bg-pizza-charcoal border-t border-pizza-border text-stone-400 text-xs pb-20 md:pb-8 pt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-pizza-border">
          {/* Col 1: Marca */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2 text-pizza-cream font-display font-black text-lg">
              <div className="w-7 h-7 rounded-lg bg-pizza-terracotta flex items-center justify-center text-white">
                <Flame className="w-4 h-4 text-pizza-gold" />
              </div>
              <span>FORNO & MASSA</span>
            </div>
            <p className="text-xs leading-relaxed text-stone-400">
              Pizzaria artesanal com fermentação natural de 48h e assamento em forno a lenha de pedra vulcânica.
            </p>
            <div className="pt-1 flex items-center gap-1 text-[11px] text-stone-500">
              <span>Feito com paixão italiana</span>
              <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            </div>
          </div>

          {/* Col 2: Localização & Atendimento */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-pizza-cream font-display uppercase tracking-wider">
              Localização & Retirada
            </h4>
            <div className="flex items-start gap-2 text-xs">
              <MapPin className="w-4 h-4 text-pizza-terracotta shrink-0 mt-0.5" />
              <span>Rua das Pizzas Artesanais, 1000 — Vila Gastronômica, São Paulo - SP</span>
            </div>
            <div className="flex items-center gap-2 text-xs pt-1">
              <Phone className="w-4 h-4 text-pizza-gold shrink-0" />
              <span>WhatsApp: (11) 99999-9999</span>
            </div>
          </div>

          {/* Col 3: Horários */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-pizza-cream font-display uppercase tracking-wider">
              Turnos do Forno
            </h4>
            <div className="flex items-start gap-2 text-xs">
              <Clock className="w-4 h-4 text-pizza-gold shrink-0 mt-0.5" />
              <div>
                <p className="text-stone-300">Terça a Domingo: 18:00 às 23:30</p>
                <p className="text-stone-400">Sexta e Sábado: até às 02:00</p>
                <p className="text-stone-500 mt-1">Segunda-feira: Fechado para descanso</p>
              </div>
            </div>
          </div>

          {/* Col 4: Pagamentos Aceitos */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-pizza-cream font-display uppercase tracking-wider">
              Formas de Pagamento
            </h4>
            <p className="text-xs text-stone-400">Pague com segurança no app ou na entrega:</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Badge variant="default">PIX Instantâneo</Badge>
              <Badge variant="default">Cartão de Crédito</Badge>
              <Badge variant="default">Cartão de Débito</Badge>
              <Badge variant="default">Dinheiro com Troco</Badge>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-[11px] text-stone-500">
          <p>© {new Date().getFullYear()} Forno & Massa Pizzaria. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <span className="text-stone-600">•</span>
            <span>Ambiente 100% Seguro</span>
            <span className="text-stone-600">•</span>
            <span>Plataforma Oficial</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
