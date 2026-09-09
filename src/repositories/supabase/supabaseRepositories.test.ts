import { describe, it, expect, vi } from "vitest";
import {
  SupabaseCategoryRepository,
  SupabaseProductRepository,
  SupabaseDeliveryZoneRepository,
  SupabaseOrderRepository,
  SupabaseUserRoleRepository,
} from "./index";
import type { SupabaseClient } from "@supabase/supabase-js";

// Factory para criar cliente Supabase mockado
function createMockSupabaseClient(responses: Record<string, any> = {}) {
  const queryBuilder: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => Promise.resolve(responses.single || { data: null, error: null })),
    maybeSingle: vi.fn().mockImplementation(() => Promise.resolve(responses.maybeSingle || { data: null, error: null })),
    then: vi.fn().mockImplementation((resolve) => resolve(responses.list || { data: [], error: null })),
  };

  const client = {
    from: vi.fn().mockReturnValue(queryBuilder),
  } as unknown as SupabaseClient;

  return { client, queryBuilder };
}

describe("Supabase Repositories Unit Tests", () => {
  describe("SupabaseCategoryRepository", () => {
    it("listActive() consulta categorias ativas ordenadas por order_index", async () => {
      const mockCategories = [
        { id: "cat-1", name: "Pizzas", slug: "pizzas", order_index: 0, is_active: true },
      ];
      const { client, queryBuilder } = createMockSupabaseClient({
        list: { data: mockCategories, error: null },
      });

      const repo = new SupabaseCategoryRepository(client);
      const result = await repo.listActive();

      expect(client.from).toHaveBeenCalledWith("categories");
      expect(queryBuilder.select).toHaveBeenCalledWith("*");
      expect(queryBuilder.eq).toHaveBeenCalledWith("is_active", true);
      expect(queryBuilder.order).toHaveBeenCalledWith("order_index", { ascending: true });
      expect(result).toEqual(mockCategories);
    });

    it("lança erro se a consulta de categorias falhar", async () => {
      const { client } = createMockSupabaseClient({
        list: { data: null, error: { message: "Conexão recusada" } },
      });

      const repo = new SupabaseCategoryRepository(client);
      await expect(repo.listActive()).rejects.toThrow("Erro ao listar categorias ativas: Conexão recusada");
    });
  });

  describe("SupabaseProductRepository", () => {
    it("findByCategory() filtra por category_id e is_active = true", async () => {
      const mockProducts = [
        { id: "prod-1", name: "Margherita", category_id: "cat-1", is_active: true },
      ];
      const { client, queryBuilder } = createMockSupabaseClient({
        list: { data: mockProducts, error: null },
      });

      const repo = new SupabaseProductRepository(client);
      const result = await repo.findByCategory("cat-1");

      expect(client.from).toHaveBeenCalledWith("products");
      expect(queryBuilder.eq).toHaveBeenCalledWith("category_id", "cat-1");
      expect(queryBuilder.eq).toHaveBeenCalledWith("is_active", true);
      expect(result).toEqual(mockProducts);
    });

    it("findByIds() retorna vazio se array de IDs estiver vazio sem chamar banco", async () => {
      const { client } = createMockSupabaseClient();
      const repo = new SupabaseProductRepository(client);

      const result = await repo.findByIds([]);
      expect(result).toEqual([]);
      expect(client.from).not.toHaveBeenCalled();
    });
  });

  describe("SupabaseDeliveryZoneRepository", () => {
    it("findByNeighborhood() busca por nome de bairro case-insensitive com ilike", async () => {
      const mockZone = {
        id: "zone-1",
        neighborhood: "Centro",
        fee_cents: 700,
        estimated_time_minutes: 40,
        active: true,
      };
      const { client, queryBuilder } = createMockSupabaseClient({
        maybeSingle: { data: mockZone, error: null },
      });

      const repo = new SupabaseDeliveryZoneRepository(client);
      const result = await repo.findByNeighborhood(" Centro ");

      expect(client.from).toHaveBeenCalledWith("delivery_zones");
      expect(queryBuilder.ilike).toHaveBeenCalledWith("neighborhood", "Centro");
      expect(result).toEqual(mockZone);
    });
  });

  describe("SupabaseOrderRepository", () => {
    it("listByStatus() filtra pedidos pelo status especificado ordenados por created_at DESC", async () => {
      const mockOrders = [
        { id: "ord-1", display_id: "ORD-001", status: "novo", total_cents: 8500 },
      ];
      const { client, queryBuilder } = createMockSupabaseClient({
        list: { data: mockOrders, error: null },
      });

      const repo = new SupabaseOrderRepository(client);
      const result = await repo.listByStatus("novo");

      expect(client.from).toHaveBeenCalledWith("orders");
      expect(queryBuilder.eq).toHaveBeenCalledWith("status", "novo");
      expect(queryBuilder.order).toHaveBeenCalledWith("created_at", { ascending: false });
      expect(result).toEqual(mockOrders);
    });

    it("updateStatus() atualiza status de um pedido existente", async () => {
      const updatedOrder = {
        id: "ord-1",
        display_id: "ORD-001",
        status: "em_preparo",
      };
      const { client, queryBuilder } = createMockSupabaseClient({
        single: { data: updatedOrder, error: null },
      });

      const repo = new SupabaseOrderRepository(client);
      const result = await repo.updateStatus("ord-1", "em_preparo");

      expect(client.from).toHaveBeenCalledWith("orders");
      expect(queryBuilder.update).toHaveBeenCalledWith({ status: "em_preparo" });
      expect(queryBuilder.eq).toHaveBeenCalledWith("id", "ord-1");
      expect(result).toEqual(updatedOrder);
    });
  });

  describe("SupabaseUserRoleRepository", () => {
    it("isAdmin() retorna true para usuário com papel 'admin'", async () => {
      const { client } = createMockSupabaseClient({
        maybeSingle: { data: { user_id: "user-1", role: "admin" }, error: null },
      });

      const repo = new SupabaseUserRoleRepository(client);
      const isAdmin = await repo.isAdmin("user-1");

      expect(isAdmin).toBe(true);
    });

    it("isAdmin() retorna false para usuário com papel 'staff'", async () => {
      const { client } = createMockSupabaseClient({
        maybeSingle: { data: { user_id: "user-2", role: "staff" }, error: null },
      });

      const repo = new SupabaseUserRoleRepository(client);
      const isAdmin = await repo.isAdmin("user-2");

      expect(isAdmin).toBe(false);
    });

    it("isStaffOrAdmin() retorna true tanto para 'admin' quanto para 'staff'", async () => {
      const { client: staffClient } = createMockSupabaseClient({
        maybeSingle: { data: { user_id: "user-staff", role: "staff" }, error: null },
      });
      const staffRepo = new SupabaseUserRoleRepository(staffClient);
      expect(await staffRepo.isStaffOrAdmin("user-staff")).toBe(true);

      const { client: adminClient } = createMockSupabaseClient({
        maybeSingle: { data: { user_id: "user-admin", role: "admin" }, error: null },
      });
      const adminRepo = new SupabaseUserRoleRepository(adminClient);
      expect(await adminRepo.isStaffOrAdmin("user-admin")).toBe(true);

      const { client: anonClient } = createMockSupabaseClient({
        maybeSingle: { data: null, error: null },
      });
      const anonRepo = new SupabaseUserRoleRepository(anonClient);
      expect(await anonRepo.isStaffOrAdmin("user-anon")).toBe(false);
    });
  });
});
