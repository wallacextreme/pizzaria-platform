import { describe, it, expect } from "vitest";
import {
  getStoreOperationalStatus,
  timeStringToMinutes,
  isMinuteInInterval,
  isMinuteInPreviousDayOvernight,
} from "./storeHours";
import type { StoreSettings } from "@/types/domain";

const mockSettings: StoreSettings = {
  id: "settings-1",
  manual_override: "auto",
  whatsapp_number: "5511999999999",
  half_and_half_pricing_rule: "maior_valor",
  delivery_settings: {
    min_order_cents: 3000,
    default_estimated_time_min: 45,
  },
  updated_at: new Date().toISOString(),
  operating_hours: [
    // 0 = Domingo: 18:00 às 23:30
    {
      day_of_week: 0,
      is_open: true,
      intervals: [{ start: "18:00", end: "23:30" }],
    },
    // 1 = Segunda: Fechado
    {
      day_of_week: 1,
      is_open: false,
      intervals: [],
    },
    // 2 = Terça: 18:00 às 23:30
    {
      day_of_week: 2,
      is_open: true,
      intervals: [{ start: "18:00", end: "23:30" }],
    },
    // 3 = Quarta: 18:00 às 23:30
    {
      day_of_week: 3,
      is_open: true,
      intervals: [{ start: "18:00", end: "23:30" }],
    },
    // 4 = Quinta: 18:00 às 23:30
    {
      day_of_week: 4,
      is_open: true,
      intervals: [{ start: "18:00", end: "23:30" }],
    },
    // 5 = Sexta: Turno Noturno com virada de meia-noite (18:00 às 02:00 do sábado)
    {
      day_of_week: 5,
      is_open: true,
      intervals: [{ start: "18:00", end: "02:00" }],
    },
    // 6 = Sábado: 18:00 às 02:00
    {
      day_of_week: 6,
      is_open: true,
      intervals: [{ start: "18:00", end: "02:00" }],
    },
  ],
};

describe("Domain Store Hours Logic", () => {
  it("deve converter string de horário HH:mm para minutos corretamente", () => {
    expect(timeStringToMinutes("00:00")).toBe(0);
    expect(timeStringToMinutes("01:30")).toBe(90);
    expect(timeStringToMinutes("18:00")).toBe(1080);
    expect(timeStringToMinutes("23:59")).toBe(1439);
  });

  it("deve lançar erro em formato de horário inválido", () => {
    expect(() => timeStringToMinutes("25:00")).toThrow();
    expect(() => timeStringToMinutes("ab:cd")).toThrow();
  });

  it("deve validar se um minuto está dentro de intervalo com isMinuteInInterval", () => {
    const normalInterval = { start: "18:00", end: "23:30" };
    expect(isMinuteInInterval(18 * 60 + 30, normalInterval)).toBe(true);
    expect(isMinuteInInterval(17 * 60, normalInterval)).toBe(false);

    const overnightInterval = { start: "18:00", end: "02:00" };
    expect(isMinuteInInterval(20 * 60, overnightInterval)).toBe(true);
    expect(isMinuteInInterval(15 * 60, overnightInterval)).toBe(false);
  });

  it("deve validar cauda do dia anterior com isMinuteInPreviousDayOvernight", () => {
    const overnightInterval = { start: "18:00", end: "02:00" };
    // 01:30 da madrugada do dia seguinte (90 min) está dentro de 00:00 até 02:00 (120 min)
    expect(isMinuteInPreviousDayOvernight(90, overnightInterval)).toBe(true);
    // 02:30 da madrugada (150 min) está fora
    expect(isMinuteInPreviousDayOvernight(150, overnightInterval)).toBe(false);

    const normalInterval = { start: "18:00", end: "23:00" };
    expect(isMinuteInPreviousDayOvernight(90, normalInterval)).toBe(false);
  });

  describe("Manual Overrides", () => {
    it("deve retornar Aberto quando manual_override for 'aberto'", () => {
      const settings: StoreSettings = {
        ...mockSettings,
        manual_override: "aberto",
      };
      const status = getStoreOperationalStatus(settings, new Date("2026-09-07T10:00:00")); // Segunda às 10h (normalmente fechado)
      expect(status.isOpen).toBe(true);
      expect(status.statusText).toBe("Aberto");
      expect(status.reason).toContain("comando manual");
    });

    it("deve retornar Fechado quando manual_override for 'fechado'", () => {
      const settings: StoreSettings = {
        ...mockSettings,
        manual_override: "fechado",
      };
      const status = getStoreOperationalStatus(settings, new Date("2026-09-11T20:00:00")); // Sexta às 20h (normalmente aberto)
      expect(status.isOpen).toBe(false);
      expect(status.statusText).toBe("Fechado");
      expect(status.reason).toContain("comando manual");
    });
  });

  describe("Modo Automático - Horários Normais", () => {
    it("deve retornar Aberto em horário comercial válido (Quinta às 19:30)", () => {
      // 2026-09-10 é uma Quinta-feira
      const refDate = new Date(2026, 8, 10, 19, 30, 0);
      const status = getStoreOperationalStatus(mockSettings, refDate);
      expect(status.isOpen).toBe(true);
      expect(status.statusText).toBe("Aberto");
      expect(status.reason).toContain("23:30");
    });

    it("deve retornar Fechado antes da abertura (Quinta às 17:59)", () => {
      const refDate = new Date(2026, 8, 10, 17, 59, 0);
      const status = getStoreOperationalStatus(mockSettings, refDate);
      expect(status.isOpen).toBe(false);
      expect(status.statusText).toBe("Fechado");
      expect(status.reason).toContain("hoje às 18:00");
    });

    it("deve retornar Fechado após o encerramento (Quinta às 23:31)", () => {
      const refDate = new Date(2026, 8, 10, 23, 31, 0);
      const status = getStoreOperationalStatus(mockSettings, refDate);
      expect(status.isOpen).toBe(false);
      expect(status.statusText).toBe("Fechado");
      expect(status.reason).toContain("amanhã às 18:00");
    });

    it("deve retornar Fechado em dia que a loja não abre (Segunda-feira)", () => {
      // 2026-09-07 é Segunda-feira
      const refDate = new Date(2026, 8, 7, 19, 0, 0);
      const status = getStoreOperationalStatus(mockSettings, refDate);
      expect(status.isOpen).toBe(false);
      expect(status.statusText).toBe("Fechado");
      expect(status.reason).toContain("amanhã às 18:00");
    });
  });

  describe("Modo Automático - Turnos Noturnos com Virada de Meia-Noite", () => {
    it("deve retornar Aberto na noite de Sexta antes da meia-noite (Sexta 23:30)", () => {
      // 2026-09-11 é Sexta-feira
      const refDate = new Date(2026, 8, 11, 23, 30, 0);
      const status = getStoreOperationalStatus(mockSettings, refDate);
      expect(status.isOpen).toBe(true);
      expect(status.statusText).toBe("Aberto");
    });

    it("deve retornar Aberto na madrugada de Sábado pertencente ao turno de Sexta (Sábado 01:15)", () => {
      // 2026-09-12 é Sábado
      const refDate = new Date(2026, 8, 12, 1, 15, 0);
      const status = getStoreOperationalStatus(mockSettings, refDate);
      expect(status.isOpen).toBe(true);
      expect(status.statusText).toBe("Aberto");
      expect(status.reason).toContain("Turno noturno em andamento até às 02:00");
    });

    it("deve retornar Fechado após o término do turno da madrugada (Sábado 02:05)", () => {
      const refDate = new Date(2026, 8, 12, 2, 5, 0);
      const status = getStoreOperationalStatus(mockSettings, refDate);
      expect(status.isOpen).toBe(false);
      expect(status.statusText).toBe("Fechado");
      expect(status.reason).toContain("hoje às 18:00");
    });
  });
});
