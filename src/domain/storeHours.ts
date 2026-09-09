/**
 * Store Hours Domain Logic — Verificação de Status Operacional da Loja
 * 
 * Regra pura, determinística e testável.
 * Suporta:
 * 1. Override manual ('aberto', 'fechado', 'auto')
 * 2. Múltiplos intervalos por dia
 * 3. Turnos noturnos que atravessam a meia-noite (ex: 18:00 às 02:00)
 * 4. Fuso horário de referência configurável (default: America/Sao_Paulo)
 */

import type { StoreSettings, DayOperatingHours, OperatingInterval } from "@/types/domain";

export interface StoreOperationalStatus {
  isOpen: boolean;
  statusText: "Aberto" | "Fechado";
  reason: string;
  nextScheduleInfo?: string;
}

/**
 * Converte "HH:mm" para minutos desde o início do dia (0 a 1439).
 */
export function timeStringToMinutes(timeStr: string): number {
  const [hoursStr = "0", minutesStr = "0"] = timeStr.split(":");
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Formato de horário inválido: "${timeStr}". Esperado "HH:mm".`);
  }
  return hours * 60 + minutes;
}

/**
 * Verifica se um determinado minuto do dia está dentro de um intervalo.
 * Se start <= end: [start, end)
 * Se start > end (virada de meia-noite, ex 18:00 às 02:00):
 *   No mesmo dia do start: >= start
 *   No dia seguinte: < end (verificado via shift do dia anterior)
 */
export function isMinuteInInterval(currentMinute: number, interval: OperatingInterval): boolean {
  const startMin = timeStringToMinutes(interval.start);
  const endMin = timeStringToMinutes(interval.end);

  if (startMin <= endMin) {
    return currentMinute >= startMin && currentMinute < endMin;
  } else {
    // Virada de noite: a partir do start até 23:59
    return currentMinute >= startMin;
  }
}

/**
 * Verifica se um minuto no dia seguinte pertence à cauda de um turno noturno iniciado no dia anterior.
 */
export function isMinuteInPreviousDayOvernight(currentMinute: number, interval: OperatingInterval): boolean {
  const startMin = timeStringToMinutes(interval.start);
  const endMin = timeStringToMinutes(interval.end);

  if (startMin > endMin) {
    // É um turno noturno: da meia-noite (00:00) até o endMin do dia seguinte
    return currentMinute < endMin;
  }
  return false;
}

/**
 * Avalia o status operacional atual da loja.
 * @param settings Configurações da loja
 * @param referenceDate Data de referência para avaliação (default: now)
 */
export function getStoreOperationalStatus(
  settings: StoreSettings,
  referenceDate: Date = new Date()
): StoreOperationalStatus {
  // 1. Verificação de Override Manual
  if (settings.manual_override === "aberto") {
    return {
      isOpen: true,
      statusText: "Aberto",
      reason: "Loja aberta por comando manual do gestor",
    };
  }

  if (settings.manual_override === "fechado") {
    return {
      isOpen: false,
      statusText: "Fechado",
      reason: "Loja fechada por comando manual do gestor",
    };
  }

  // 2. Modo Automático: avaliação por dia e horário
  const currentDayOfWeek = referenceDate.getDay(); // 0 = Domingo, ..., 6 = Sábado
  const currentMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();

  // A. Verifica intervalos do dia atual
  const todayConfig = settings.operating_hours.find(
    (h) => h.day_of_week === currentDayOfWeek
  );

  if (todayConfig && todayConfig.is_open) {
    for (const interval of todayConfig.intervals) {
      if (isMinuteInInterval(currentMinutes, interval)) {
        return {
          isOpen: true,
          statusText: "Aberto",
          reason: `Horário de atendimento hoje até às ${interval.end}`,
        };
      }
    }
  }

  // B. Verifica se ainda estamos na cauda da madrugada de um turno do dia anterior
  const previousDayOfWeek = (currentDayOfWeek + 6) % 7;
  const previousDayConfig = settings.operating_hours.find(
    (h) => h.day_of_week === previousDayOfWeek
  );

  if (previousDayConfig && previousDayConfig.is_open) {
    for (const interval of previousDayConfig.intervals) {
      if (isMinuteInPreviousDayOvernight(currentMinutes, interval)) {
        return {
          isOpen: true,
          statusText: "Aberto",
          reason: `Turno noturno em andamento até às ${interval.end}`,
        };
      }
    }
  }

  // C. Loja fechada no momento: busca o próximo horário de abertura para informar o cliente
  const nextInfo = getNextOpeningInfo(settings.operating_hours, currentDayOfWeek, currentMinutes);

  return {
    isOpen: false,
    statusText: "Fechado",
    reason: nextInfo ? `Abre ${nextInfo}` : "Fechado no momento",
    nextScheduleInfo: nextInfo,
  };
}

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function getNextOpeningInfo(
  hours: DayOperatingHours[],
  currentDay: number,
  currentMinutes: number
): string | undefined {
  // Procura hoje mais tarde
  const today = hours.find((h) => h.day_of_week === currentDay);
  if (today && today.is_open) {
    for (const interval of today.intervals) {
      const startMin = timeStringToMinutes(interval.start);
      if (startMin > currentMinutes) {
        return `hoje às ${interval.start}`;
      }
    }
  }

  // Procura nos próximos 6 dias
  for (let offset = 1; offset <= 7; offset++) {
    const nextDay = (currentDay + offset) % 7;
    const dayConfig = hours.find((h) => h.day_of_week === nextDay);
    if (dayConfig && dayConfig.is_open && dayConfig.intervals.length > 0) {
      const firstInterval = dayConfig.intervals[0];
      if (firstInterval) {
        const dayLabel = offset === 1 ? "amanhã" : `em ${DAY_NAMES[nextDay]}`;
        return `${dayLabel} às ${firstInterval.start}`;
      }
    }
  }

  return undefined;
}
