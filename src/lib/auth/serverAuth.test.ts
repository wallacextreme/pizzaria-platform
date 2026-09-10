import { describe, it, expect, vi, beforeEach } from "vitest";
import { authenticateServerRequest } from "./serverAuth";

// Mocks para os clientes Supabase
const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn().mockImplementation(async () => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn().mockImplementation(() => ({
    from: mockFrom,
  })),
}));

describe("serverAuth Server Guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 401 Unauthorized quando não há usuário logado na sessão", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = new Request("http://localhost:3000/api/orders");
    const result = await authenticateServerRequest(req, "staff");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(401);
      const data = await result.response.json();
      expect(data.error).toContain("Sessão não autenticada");
    }
  });

  it("retorna 403 Forbidden quando usuário autenticado não possui papel em user_roles", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "sem-cargo@teste.com" } },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    const req = new Request("http://localhost:3000/api/orders");
    const result = await authenticateServerRequest(req, "staff");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(403);
      const data = await result.response.json();
      expect(data.error).toContain("não possui atribuição de papel administrativo em user_roles");
    }
  });

  it("permite staff acessar endpoint que exige 'staff'", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "staff-1", email: "cozinha@pizzaria.com" } },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { role: "staff" }, error: null }),
    });

    const req = new Request("http://localhost:3000/api/orders");
    const result = await authenticateServerRequest(req, "staff");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.user.role).toBe("staff");
      expect(result.user.isStaff).toBe(true);
      expect(result.user.isAdmin).toBe(false);
    }
  });

  it("bloqueia staff (403) em endpoint que exige 'admin'", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "staff-1", email: "cozinha@pizzaria.com" } },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { role: "staff" }, error: null }),
    });

    const req = new Request("http://localhost:3000/api/products");
    const result = await authenticateServerRequest(req, "admin");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(403);
      const data = await result.response.json();
      expect(data.error).toContain("exige privilégios de Administrador Geral (admin)");
    }
  });

  it("permite admin acessar endpoints com requisito 'admin' e 'staff'", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1", email: "gerente@pizzaria.com" } },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { role: "admin" }, error: null }),
    });

    const req = new Request("http://localhost:3000/api/store/status");
    const resultAdmin = await authenticateServerRequest(req, "admin");
    expect(resultAdmin.success).toBe(true);
    if (resultAdmin.success) {
      expect(resultAdmin.user.role).toBe("admin");
      expect(resultAdmin.user.isAdmin).toBe(true);
      expect(resultAdmin.user.isStaff).toBe(true);
    }

    const resultStaff = await authenticateServerRequest(req, "staff");
    expect(resultStaff.success).toBe(true);
  });
});
