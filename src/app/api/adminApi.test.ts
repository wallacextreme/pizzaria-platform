import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getOrders, PATCH as patchOrders } from "./orders/route";
import { PATCH as patchProducts } from "./products/route";
import { POST as postStoreStatus } from "./store/status/route";
import { globalOrderRepository } from "@/repositories/mockOrderRepository";
import { MOCK_PRODUCTS } from "@/lib/mockData";

// Mock de authenticateServerRequest
const mockAuth = vi.fn();
vi.mock("@/lib/auth/serverAuth", () => ({
  authenticateServerRequest: (...args: unknown[]) => mockAuth(...args),
}));

describe("Admin API Endpoints Security & RBAC Protection", () => {
  beforeEach(() => {
    globalOrderRepository.clear();
    vi.clearAllMocks();
  });

  describe("GET & PATCH /api/orders", () => {
    it("bloqueia acesso à listagem geral sem autenticação (401)", async () => {
      mockAuth.mockResolvedValue({
        success: false,
        response: new Response(JSON.stringify({ error: "Sessão não autenticada" }), { status: 401 }),
      });

      const req = new Request("http://localhost:3000/api/orders");
      const res = await getOrders(req);
      expect(res.status).toBe(401);
    });

    it("permite staff consultar a lista geral de pedidos", async () => {
      mockAuth.mockResolvedValue({
        success: true,
        user: { userId: "stf-1", role: "staff", isStaff: true, isAdmin: false },
      });

      const req = new Request("http://localhost:3000/api/orders");
      const res = await getOrders(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.orders)).toBe(true);
    });

    it("bloqueia atualização de status sem autenticação (401)", async () => {
      mockAuth.mockResolvedValue({
        success: false,
        response: new Response(JSON.stringify({ error: "Sessão não autenticada" }), { status: 401 }),
      });

      const req = new Request("http://localhost:3000/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "ord-1", status: "em_preparo" }),
      });

      const res = await patchOrders(req);
      expect(res.status).toBe(401);
    });

    it("permite staff avançar status conforme a máquina de estados", async () => {
      mockAuth.mockResolvedValue({
        success: true,
        user: { userId: "stf-1", role: "staff", isStaff: true, isAdmin: false },
      });

      // Cria pedido com status 'novo'
      const order = await globalOrderRepository.create({
        display_id: "#PZ-9001",
        status: "novo",
        customer: { name: "Teste", phone: "11999999999" },
        delivery_type: "delivery",
        items: [],
        payment_method: "pix",
        delivery_fee_cents: 500,
        subtotal_cents: 5000,
        total_cents: 5500,
        fulfillment_channel: "web",
      });

      const req = new Request("http://localhost:3000/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, status: "em_preparo" }),
      });

      const res = await patchOrders(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.order.status).toBe("em_preparo");
    });

    it("rejeita salto arbitrário de status (ex: novo -> concluido) com 400", async () => {
      mockAuth.mockResolvedValue({
        success: true,
        user: { userId: "stf-1", role: "staff", isStaff: true, isAdmin: false },
      });

      const order = await globalOrderRepository.create({
        display_id: "#PZ-9002",
        status: "novo",
        customer: { name: "Teste", phone: "11999999999" },
        delivery_type: "delivery",
        items: [],
        payment_method: "pix",
        delivery_fee_cents: 500,
        subtotal_cents: 5000,
        total_cents: 5500,
        fulfillment_channel: "web",
      });

      const req = new Request("http://localhost:3000/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, status: "concluido" }),
      });

      const res = await patchOrders(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("não é permitido alterar status de");
    });
  });

  describe("PATCH /api/products", () => {
    it("bloqueia staff ao tentar pausar/reativar produtos (403)", async () => {
      mockAuth.mockResolvedValue({
        success: false,
        response: new Response(
          JSON.stringify({ error: "Acesso negado: esta operação exige privilégios de Administrador Geral (admin)." }),
          { status: 403 }
        ),
      });

      const req = new Request("http://localhost:3000/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "prod-margherita", is_active: false }),
      });

      const res = await patchProducts(req);
      expect(res.status).toBe(403);
    });

    it("permite admin pausar e reativar produto", async () => {
      mockAuth.mockResolvedValue({
        success: true,
        user: { userId: "adm-1", role: "admin", isStaff: true, isAdmin: true },
      });

      const testProdId = MOCK_PRODUCTS[0]?.id || "prod-1";

      // Pausar produto
      const pauseReq = new Request("http://localhost:3000/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: testProdId, is_active: false }),
      });
      const pauseRes = await patchProducts(pauseReq);
      expect(pauseRes.status).toBe(200);
      const pauseJson = await pauseRes.json();
      expect(pauseJson.product.is_active).toBe(false);

      // Reativar produto
      const activateReq = new Request("http://localhost:3000/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: testProdId, is_active: true }),
      });
      const activateRes = await patchProducts(activateReq);
      expect(activateRes.status).toBe(200);
      const activateJson = await activateRes.json();
      expect(activateJson.product.is_active).toBe(true);
    });
  });

  describe("POST /api/store/status", () => {
    it("bloqueia staff ao tentar alterar status manual da loja (403)", async () => {
      mockAuth.mockResolvedValue({
        success: false,
        response: new Response(
          JSON.stringify({ error: "Acesso negado: esta operação exige privilégios de Administrador Geral (admin)." }),
          { status: 403 }
        ),
      });

      const req = new Request("http://localhost:3000/api/store/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manual_override: "fechado" }),
      });

      const res = await postStoreStatus(req);
      expect(res.status).toBe(403);
    });

    it("permite admin alterar override da loja para 'fechado', 'aberto' e 'auto'", async () => {
      mockAuth.mockResolvedValue({
        success: true,
        user: { userId: "adm-1", role: "admin", isStaff: true, isAdmin: true },
      });

      // 1. Fechado
      const closeReq = new Request("http://localhost:3000/api/store/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manual_override: "fechado" }),
      });
      const closeRes = await postStoreStatus(closeReq);
      expect(closeRes.status).toBe(200);
      const closeJson = await closeRes.json();
      expect(closeJson.manual_override).toBe("fechado");
      expect(closeJson.operationalStatus.isOpen).toBe(false);

      // 2. Aberto
      const openReq = new Request("http://localhost:3000/api/store/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manual_override: "aberto" }),
      });
      const openRes = await postStoreStatus(openReq);
      expect(openRes.status).toBe(200);
      const openJson = await openRes.json();
      expect(openJson.manual_override).toBe("aberto");
      expect(openJson.operationalStatus.isOpen).toBe(true);

      // 3. Auto
      const autoReq = new Request("http://localhost:3000/api/store/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manual_override: "auto" }),
      });
      const autoRes = await postStoreStatus(autoReq);
      expect(autoRes.status).toBe(200);
    });
  });
});
