import type { SupabaseClient } from "@supabase/supabase-js";
import type { IStoreSettingsRepository } from "../interfaces";
import type { StoreSettings } from "@/types/domain";

export class SupabaseStoreSettingsRepository implements IStoreSettingsRepository {
  constructor(private client: SupabaseClient) {}

  async get(): Promise<StoreSettings> {
    const { data, error } = await this.client
      .from("store_settings")
      .select("*")
      .limit(1)
      .single();

    if (error) {
      throw new Error(`Erro ao buscar configurações da loja: ${error.message}`);
    }

    return data as StoreSettings;
  }

  async update(data: Partial<StoreSettings>): Promise<StoreSettings> {
    // Busca a linha singleton existente
    const current = await this.get();

    const { data: updated, error } = await this.client
      .from("store_settings")
      .update(data)
      .eq("id", current.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar configurações da loja: ${error.message}`);
    }

    return updated as StoreSettings;
  }
}
