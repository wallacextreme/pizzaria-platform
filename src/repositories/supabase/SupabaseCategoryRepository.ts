import type { SupabaseClient } from "@supabase/supabase-js";
import type { ICategoryRepository } from "../interfaces";
import type { Category, UUID } from "@/types/domain";

export class SupabaseCategoryRepository implements ICategoryRepository {
  constructor(private client: SupabaseClient) {}

  async listActive(): Promise<Category[]> {
    const { data, error } = await this.client
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("order_index", { ascending: true });

    if (error) {
      throw new Error(`Erro ao listar categorias ativas: ${error.message}`);
    }

    return (data || []) as Category[];
  }

  async listAll(): Promise<Category[]> {
    const { data, error } = await this.client
      .from("categories")
      .select("*")
      .order("order_index", { ascending: true });

    if (error) {
      throw new Error(`Erro ao listar todas as categorias: ${error.message}`);
    }

    return (data || []) as Category[];
  }

  async findById(id: UUID): Promise<Category | null> {
    const { data, error } = await this.client
      .from("categories")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Erro ao buscar categoria por ID: ${error.message}`);
    }

    return (data as Category) || null;
  }

  async create(category: Omit<Category, "id" | "created_at" | "updated_at">): Promise<Category> {
    const { data, error } = await this.client
      .from("categories")
      .insert(category)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar categoria: ${error.message}`);
    }

    return data as Category;
  }

  async update(id: UUID, data: Partial<Category>): Promise<Category> {
    const { data: updated, error } = await this.client
      .from("categories")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar categoria: ${error.message}`);
    }

    return updated as Category;
  }

  async delete(id: UUID): Promise<void> {
    const { error } = await this.client
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Erro ao excluir categoria: ${error.message}`);
    }
  }
}
