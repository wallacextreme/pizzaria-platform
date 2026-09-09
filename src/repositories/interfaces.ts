/**
 * Repository Interfaces (DAO Contracts)
 * 
 * PADRÃO DE ARQUITETURA:
 * As interfaces definem os contratos formais de persistência e consulta.
 * A implementação oficial da aplicação utiliza o Supabase (@supabase/supabase-js).
 * Implementações Mock são utilizadas estritamente na suíte de testes automatizados.
 */

import type {
  Category,
  Product,
  DeliveryZone,
  Order,
  StoreSettings,
  UserRole,
  UUID,
  OrderStatus,
} from "@/types/domain";

export interface ICategoryRepository {
  listActive(): Promise<Category[]>;
  listAll(): Promise<Category[]>;
  findById(id: UUID): Promise<Category | null>;
  create(category: Omit<Category, "id" | "created_at" | "updated_at">): Promise<Category>;
  update(id: UUID, data: Partial<Category>): Promise<Category>;
  delete(id: UUID): Promise<void>;
}

export interface IProductRepository {
  listActive(): Promise<Product[]>;
  listAll(): Promise<Product[]>;
  findByCategory(categoryId: UUID): Promise<Product[]>;
  findById(id: UUID): Promise<Product | null>;
  findByIds(ids: UUID[]): Promise<Product[]>;
  create(product: Omit<Product, "id" | "created_at" | "updated_at">): Promise<Product>;
  update(id: UUID, data: Partial<Product>): Promise<Product>;
  delete(id: UUID): Promise<void>;
}

export interface IDeliveryZoneRepository {
  listActive(): Promise<DeliveryZone[]>;
  listAll(): Promise<DeliveryZone[]>;
  findById(id: UUID): Promise<DeliveryZone | null>;
  findByNeighborhood(neighborhood: string): Promise<DeliveryZone | null>;
  create(zone: Omit<DeliveryZone, "id" | "created_at" | "updated_at">): Promise<DeliveryZone>;
  update(id: UUID, data: Partial<DeliveryZone>): Promise<DeliveryZone>;
  delete(id: UUID): Promise<void>;
}

export interface IOrderRepository {
  listAll(limit?: number): Promise<Order[]>;
  listByStatus(status: OrderStatus): Promise<Order[]>;
  findById(id: UUID): Promise<Order | null>;
  findByDisplayId(displayId: string): Promise<Order | null>;
  create(order: Omit<Order, "id" | "created_at" | "updated_at">): Promise<Order>;
  updateStatus(id: UUID, status: OrderStatus): Promise<Order>;
}

export interface IStoreSettingsRepository {
  get(): Promise<StoreSettings>;
  update(data: Partial<StoreSettings>): Promise<StoreSettings>;
}

export interface IUserRoleRepository {
  getRoleByUserId(userId: UUID): Promise<UserRole | null>;
  isAdmin(userId: UUID): Promise<boolean>;
  isStaffOrAdmin(userId: UUID): Promise<boolean>;
}
