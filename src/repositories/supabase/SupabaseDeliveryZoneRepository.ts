import type { SupabaseClient } from "@supabase/supabase-js";
import type { IDeliveryZoneRepository } from "../interfaces";
import type { DeliveryZone, UUID } from "@/types/domain";

export class SupabaseDeliveryZoneRepository implements IDeliveryZoneRepository {
  constructor(private client: SupabaseClient) {}

  async listActive(): Promise<DeliveryZone[]> {
    const { data, error } = await this.client
      .from("delivery_zones")
      .select("*")
      .eq("active", true)
      .order("neighborhood", { ascending: true });

    if (error) {
      throw new Error(`Erro ao listar zonas de entrega ativas: ${error.message}`);
    }

    return (data || []) as DeliveryZone[];
  }

  async listAll(): Promise<DeliveryZone[]> {
    const { data, error } = await this.client
      .from("delivery_zones")
      .select("*")
      .order("neighborhood", { ascending: true });

    if (error) {
      throw new Error(`Erro ao listar todas as zonas de entrega: ${error.message}`);
    }

    return (data || []) as DeliveryZone[];
  }

  async findById(id: UUID): Promise<DeliveryZone | null> {
    const { data, error } = await this.client
      .from("delivery_zones")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Erro ao buscar zona de entrega por ID: ${error.message}`);
    }

    return (data as DeliveryZone) || null;
  }

  async findByNeighborhood(neighborhood: string): Promise<DeliveryZone | null> {
    const { data, error } = await this.client
      .from("delivery_zones")
      .select("*")
      .ilike("neighborhood", neighborhood.trim())
      .eq("active", true)
      .maybeSingle();

    if (error) {
      throw new Error(`Erro ao buscar zona de entrega por bairro: ${error.message}`);
    }

    return (data as DeliveryZone) || null;
  }

  async create(zone: Omit<DeliveryZone, "id" | "created_at" | "updated_at">): Promise<DeliveryZone> {
    const { data, error } = await this.client
      .from("delivery_zones")
      .insert(zone)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar zona de entrega: ${error.message}`);
    }

    return data as DeliveryZone;
  }

  async update(id: UUID, data: Partial<DeliveryZone>): Promise<DeliveryZone> {
    const { data: updated, error } = await this.client
      .from("delivery_zones")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar zona de entrega: ${error.message}`);
    }

    return updated as DeliveryZone;
  }

  async delete(id: UUID): Promise<void> {
    const { error } = await this.client
      .from("delivery_zones")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Erro ao excluir zona de entrega: ${error.message}`);
    }
  }
}
