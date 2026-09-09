import type { SupabaseClient } from "@supabase/supabase-js";
import type { IUserRoleRepository } from "../interfaces";
import type { UserRole, UUID } from "@/types/domain";

export class SupabaseUserRoleRepository implements IUserRoleRepository {
  constructor(private client: SupabaseClient) {}

  async getRoleByUserId(userId: UUID): Promise<UserRole | null> {
    const { data, error } = await this.client
      .from("user_roles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Erro ao buscar papel do usuário: ${error.message}`);
    }

    return (data as UserRole) || null;
  }

  async isAdmin(userId: UUID): Promise<boolean> {
    const role = await this.getRoleByUserId(userId);
    return role?.role === "admin";
  }

  async isStaffOrAdmin(userId: UUID): Promise<boolean> {
    const role = await this.getRoleByUserId(userId);
    return role?.role === "admin" || role?.role === "staff";
  }
}
