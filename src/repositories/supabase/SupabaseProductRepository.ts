import type { SupabaseClient } from "@supabase/supabase-js";
import type { IProductRepository } from "../interfaces";
import type { Product, UUID } from "@/types/domain";

export class SupabaseProductRepository implements IProductRepository {
  constructor(private client: SupabaseClient) {}

  async listActive(): Promise<Product[]> {
    const { data, error } = await this.client
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`Erro ao listar produtos ativos: ${error.message}`);
    }

    return (data || []) as Product[];
  }

  async listAll(): Promise<Product[]> {
    const { data, error } = await this.client
      .from("products")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`Erro ao listar todos os produtos: ${error.message}`);
    }

    return (data || []) as Product[];
  }

  async findByCategory(categoryId: UUID): Promise<Product[]> {
    const { data, error } = await this.client
      .from("products")
      .select("*")
      .eq("category_id", categoryId)
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`Erro ao listar produtos por categoria: ${error.message}`);
    }

    return (data || []) as Product[];
  }

  async findById(id: UUID): Promise<Product | null> {
    const { data, error } = await this.client
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Erro ao buscar produto por ID: ${error.message}`);
    }

    return (data as Product) || null;
  }

  async findByIds(ids: UUID[]): Promise<Product[]> {
    if (!ids.length) return [];

    const { data, error } = await this.client
      .from("products")
      .select("*")
      .in("id", ids);

    if (error) {
      throw new Error(`Erro ao buscar produtos por lista de IDs: ${error.message}`);
    }

    return (data || []) as Product[];
  }

  async create(product: Omit<Product, "id" | "created_at" | "updated_at">): Promise<Product> {
    const { data, error } = await this.client
      .from("products")
      .insert(product)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar produto: ${error.message}`);
    }

    return data as Product;
  }

  async update(id: UUID, data: Partial<Product>): Promise<Product> {
    const { data: updated, error } = await this.client
      .from("products")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar produto: ${error.message}`);
    }

    return updated as Product;
  }

  async delete(id: UUID): Promise<void> {
    const { error } = await this.client
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Erro ao excluir produto: ${error.message}`);
    }
  }
}
