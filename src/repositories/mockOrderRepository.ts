/**
 * In-Memory Order Repository (DAO)
 * 
 * NOTA DE ARQUITETURA:
 * Implementa a interface IOrderRepository para testes automatizados e simulação local.
 * Segue estritamente as mesmas regras de integridade do PostgreSQL/Supabase.
 */

import type { IOrderRepository } from "./interfaces";
import type { Order, OrderStatus, UUID } from "@/types/domain";

export class MockOrderRepository implements IOrderRepository {
  private orders: Order[] = [];

  constructor(initialOrders: Order[] = []) {
    this.orders = [...initialOrders];
  }

  async listAll(limit = 50): Promise<Order[]> {
    return this.orders.slice(0, limit);
  }

  async listByStatus(status: OrderStatus): Promise<Order[]> {
    return this.orders.filter((o) => o.status === status);
  }

  async findById(id: UUID): Promise<Order | null> {
    const order = this.orders.find((o) => o.id === id);
    return order ? { ...order } : null;
  }

  async findByDisplayId(displayId: string): Promise<Order | null> {
    const order = this.orders.find((o) => o.display_id.toLowerCase() === displayId.toLowerCase());
    return order ? { ...order } : null;
  }

  async create(data: Omit<Order, "id" | "created_at" | "updated_at">): Promise<Order> {
    const newOrder: Order = {
      ...data,
      id: crypto.randomUUID ? crypto.randomUUID() : `ord-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.orders.unshift(newOrder);
    return { ...newOrder };
  }

  async updateStatus(id: UUID, status: OrderStatus): Promise<Order> {
    const orderIndex = this.orders.findIndex((o) => o.id === id);
    if (orderIndex === -1) {
      throw new Error(`Pedido com ID "${id}" não encontrado para atualização.`);
    }

    const updated: Order = {
      ...this.orders[orderIndex]!,
      status,
      updated_at: new Date().toISOString(),
    };

    this.orders[orderIndex] = updated;
    return { ...updated };
  }

  // Utilitário para testes
  clear(): void {
    this.orders = [];
  }
}

// Instância compartilhada em memória para Next.js Route Handlers
export const globalOrderRepository = new MockOrderRepository();
