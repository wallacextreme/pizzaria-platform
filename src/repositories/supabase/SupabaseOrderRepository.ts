import type { SupabaseClient } from "@supabase/supabase-js";
import type { IOrderRepository } from "../interfaces";
import type { Order, OrderStatus, UUID } from "@/types/domain";

export class SupabaseOrderRepository implements IOrderRepository {
  constructor(private client: SupabaseClient) {}

  async listAll(limit = 50): Promise<Order[]> {
    const { data, error } = await this.client
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Erro ao listar pedidos: ${error.message}`);
    }

    return (data || []) as Order[];
  }

  async listByStatus(status: OrderStatus): Promise<Order[]> {
    const { data, error } = await this.client
      .from("orders")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Erro ao listar pedidos por status: ${error.message}`);
    }

    return (data || []) as Order[];
  }

  async findById(id: UUID): Promise<Order | null> {
    const { data, error } = await this.client
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Erro ao buscar pedido por ID: ${error.message}`);
    }

    return (data as Order) || null;
  }

  async findByDisplayId(displayId: string): Promise<Order | null> {
    const { data, error } = await this.client
      .from("orders")
      .select("*")
      .ilike("display_id", displayId.trim())
      .maybeSingle();

    if (error) {
      throw new Error(`Erro ao buscar pedido por display_id: ${error.message}`);
    }

    return (data as Order) || null;
  }

  async create(order: Omit<Order, "id" | "created_at" | "updated_at">): Promise<Order> {
    const { data, error } = await this.client
      .from("orders")
      .insert(order)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar pedido no banco: ${error.message}`);
    }

    return data as Order;
  }

  async updateStatus(id: UUID, status: OrderStatus): Promise<Order> {
    const { data, error } = await this.client
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar status do pedido: ${error.message}`);
    }

    return data as Order;
  }
}
