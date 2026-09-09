"use client";

import * as React from "react";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { Clock, ChevronRight } from "lucide-react";
import type { StoreSettings } from "@/types/domain";
import { getStoreOperationalStatus } from "@/domain/storeHours";

interface StoreStatusBarProps {
  settings: StoreSettings;
}

const DAY_LABELS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export function StoreStatusBar({ settings }: StoreStatusBarProps) {
  const [isScheduleModalOpen, setIsScheduleModalOpen] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState<Date | null>(null);

  // Evita hydration mismatch executando o Date inicial no cliente
  React.useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const status = React.useMemo(() => {
    return getStoreOperationalStatus(settings, currentTime || new Date());
  }, [settings, currentTime]);

  return (
    <>
      <div className="w-full bg-pizza-charcoal border-b border-pizza-border py-2 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Status Badge & Reason */}
          <div className="flex items-center gap-2.5">
            <Badge
              variant={status.isOpen ? "success" : "danger"}
              dot
              pulse={status.isOpen}
            >
              {status.statusText}
            </Badge>
            <span className="text-stone-300 font-medium hidden sm:inline">
              {status.reason}
            </span>
            <span className="text-stone-400 text-[11px] sm:hidden truncate max-w-[200px]">
              {status.reason}
            </span>
          </div>

          {/* Horários Button Trigger */}
          <button
            type="button"
            onClick={() => setIsScheduleModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-stone-400 hover:text-pizza-cream transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pizza-terracotta rounded px-1"
          >
            <Clock className="w-3.5 h-3.5 text-pizza-gold" />
            <span>Horários da Semana</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Modal com Grade de Horários */}
      <Dialog
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Horários de Atendimento"
        description="Confira nossos turnos de forno a lenha para delivery e retirada."
      >
        <div className="space-y-2 text-sm mt-2">
          {settings.operating_hours.map((day) => {
            const isToday = currentTime ? currentTime.getDay() === day.day_of_week : false;
            return (
              <div
                key={day.day_of_week}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  isToday
                    ? "bg-pizza-terracotta/10 border-pizza-terracotta/40 font-semibold"
                    : "bg-pizza-charcoal border-pizza-border text-stone-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{DAY_LABELS[day.day_of_week]}</span>
                  {isToday && (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-pizza-terracotta text-white font-bold">
                      Hoje
                    </span>
                  )}
                </div>
                <div className="text-right text-xs">
                  {day.is_open ? (
                    day.intervals.map((int, i) => (
                      <span key={i} className="text-pizza-cream block">
                        {int.start} às {int.end}
                      </span>
                    ))
                  ) : (
                    <span className="text-stone-500 font-medium">Fechado</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Dialog>
    </>
  );
}
