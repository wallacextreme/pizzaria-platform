import { describe, it, expect } from "vitest";
import {
  validateStatusTransition,
  isValidStatusTransition,
  getNextFlowStatus,
  ALLOWED_STATUS_TRANSITIONS,
} from "./orderTransitions";
import type { OrderStatus } from "@/types/domain";

describe("orderTransitions Domain Logic", () => {
  describe("Transições Válidas do Fluxo Principal", () => {
    it("permite avanço sequencial completo: novo -> em_preparo -> no_forno -> saiu_para_entrega -> concluido", () => {
      expect(isValidStatusTransition("novo", "em_preparo")).toBe(true);
      expect(isValidStatusTransition("em_preparo", "no_forno")).toBe(true);
      expect(isValidStatusTransition("no_forno", "saiu_para_entrega")).toBe(true);
      expect(isValidStatusTransition("saiu_para_entrega", "concluido")).toBe(true);
    });

    it("permite cancelamento a partir de qualquer estado ativo antes de concluir", () => {
      const activeStatuses: OrderStatus[] = ["novo", "em_preparo", "no_forno", "saiu_para_entrega"];
      for (const status of activeStatuses) {
        const result = validateStatusTransition(status, "cancelado");
        expect(result.isValid).toBe(true);
      }
    });

    it("retorna o próximo status correto via getNextFlowStatus", () => {
      expect(getNextFlowStatus("novo")).toBe("em_preparo");
      expect(getNextFlowStatus("em_preparo")).toBe("no_forno");
      expect(getNextFlowStatus("no_forno")).toBe("saiu_para_entrega");
      expect(getNextFlowStatus("saiu_para_entrega")).toBe("concluido");
      expect(getNextFlowStatus("concluido")).toBeNull();
      expect(getNextFlowStatus("cancelado")).toBeNull();
    });
  });

  describe("Rejeição de Transições Inválidas", () => {
    it("não permite transição para o mesmo status", () => {
      const result = validateStatusTransition("novo", "novo");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('já se encontra no status "novo"');
    });

    it("não permite pular etapas do fluxo (ex: novo -> concluido)", () => {
      const result = validateStatusTransition("novo", "concluido");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('não é permitido alterar status de "novo" para "concluido"');
    });

    it("não permite pular etapas intermediárias (ex: novo -> no_forno)", () => {
      expect(isValidStatusTransition("novo", "no_forno")).toBe(false);
    });

    it("não permite regredir status (ex: saiu_para_entrega -> novo ou no_forno -> em_preparo)", () => {
      expect(isValidStatusTransition("saiu_para_entrega", "novo")).toBe(false);
      expect(isValidStatusTransition("no_forno", "em_preparo")).toBe(false);
      expect(isValidStatusTransition("em_preparo", "novo")).toBe(false);
      expect(isValidStatusTransition("concluido", "saiu_para_entrega")).toBe(false);
    });

    it("não permite alterar pedidos já concluídos", () => {
      const targetStatuses: OrderStatus[] = ["novo", "em_preparo", "no_forno", "saiu_para_entrega", "cancelado"];
      for (const target of targetStatuses) {
        const result = validateStatusTransition("concluido", target);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain("Pedidos concluídos são definitivos");
      }
    });

    it("não permite alterar pedidos já cancelados", () => {
      const targetStatuses: OrderStatus[] = ["novo", "em_preparo", "no_forno", "saiu_para_entrega", "concluido"];
      for (const target of targetStatuses) {
        const result = validateStatusTransition("cancelado", target);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain("Pedidos cancelados não podem ser reabertos");
      }
    });
  });

  describe("Tabela de Transições Permitidas", () => {
    it("possui definições estritas para todos os status do domínio", () => {
      expect(ALLOWED_STATUS_TRANSITIONS.novo).toEqual(["em_preparo", "cancelado"]);
      expect(ALLOWED_STATUS_TRANSITIONS.em_preparo).toEqual(["no_forno", "cancelado"]);
      expect(ALLOWED_STATUS_TRANSITIONS.no_forno).toEqual(["saiu_para_entrega", "cancelado"]);
      expect(ALLOWED_STATUS_TRANSITIONS.saiu_para_entrega).toEqual(["concluido", "cancelado"]);
      expect(ALLOWED_STATUS_TRANSITIONS.concluido).toEqual([]);
      expect(ALLOWED_STATUS_TRANSITIONS.cancelado).toEqual([]);
    });
  });
});
