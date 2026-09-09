/**
 * Domain Models & Types — Plataforma de Pizzaria Full-Stack
 * 
 * NOTA CRÍTICA DE ARQUITETURA:
 * Todos os valores monetários são estritamente inteiros representando CENTAVOS (cents).
 * Zero uso de ponto flutuante para dinheiro no domínio ou banco de dados.
 */

export type UUID = string;

export type UserRoleType = "admin" | "staff";

export interface UserRole {
  user_id: UUID;
  role: UserRoleType;
  created_at: string;
}

export interface Category {
  id: UUID;
  name: string;
  slug: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PizzaSize {
  id: string;
  name: string;
  price_cents: number; // Preço base em centavos
  slices: number;
  max_flavors: number; // 1 para brotinho, 2 para demais
}

export interface CrustOption {
  id: string;
  name: string;
  price_cents: number; // Adicional da borda em centavos
}

export interface ExtraOption {
  id: string;
  name: string;
  price_cents: number; // Adicional do extra em centavos
}

export interface ProductFlags {
  is_pizza: boolean;
  is_featured: boolean;
  badge?: string;
}

export interface Product {
  id: UUID;
  category_id: UUID;
  name: string;
  slug: string;
  description: string;
  images: string[];
  sizes: PizzaSize[];
  crust_options: CrustOption[];
  extras: ExtraOption[];
  removable_ingredients: string[];
  flags: ProductFlags;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryZone {
  id: UUID;
  neighborhood: string;
  fee_cents: number;
  estimated_time_minutes: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | "novo"
  | "em_preparo"
  | "no_forno"
  | "saiu_para_entrega"
  | "concluido"
  | "cancelado";

export type DeliveryType = "delivery" | "retirada";

export type PaymentMethod = "pix" | "cartao" | "dinheiro";

export type FulfillmentChannel = "web" | "whatsapp";

export interface CustomerInfo {
  name: string;
  phone: string;
}

export interface OrderAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  reference?: string;
}

export interface SelectedFlavor {
  product_id: UUID;
  name: string;
  price_cents: number;
}

export interface OrderItem {
  id: string;
  product_id: UUID;
  name: string;
  is_pizza: boolean;
  size?: PizzaSize;
  flavors: SelectedFlavor[]; // 1 ou 2 sabores
  crust?: CrustOption;
  extras: ExtraOption[];
  removed_ingredients: string[];
  notes?: string;
  unit_price_cents: number;
  quantity: number;
  total_price_cents: number;
}

export interface Order {
  id: UUID;
  display_id: string;
  status: OrderStatus;
  customer: CustomerInfo;
  delivery_type: DeliveryType;
  address?: OrderAddress;
  items: OrderItem[];
  payment_method: PaymentMethod;
  change_for_cents?: number;
  delivery_fee_cents: number;
  subtotal_cents: number;
  total_cents: number;
  fulfillment_channel: FulfillmentChannel;
  created_at: string;
  updated_at: string;
}

export type StoreManualOverride = "auto" | "aberto" | "fechado";

export type HalfAndHalfRule = "maior_valor" | "media_ponderada";

export interface OperatingInterval {
  start: string; // "18:00"
  end: string;   // "23:30"
}

export interface DayOperatingHours {
  day_of_week: number; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  is_open: boolean;
  intervals: OperatingInterval[];
}

export interface DeliverySettings {
  min_order_cents: number;
  default_estimated_time_min: number;
}

export interface StoreSettings {
  id: UUID;
  operating_hours: DayOperatingHours[];
  manual_override: StoreManualOverride;
  whatsapp_number: string;
  half_and_half_pricing_rule: HalfAndHalfRule;
  delivery_settings: DeliverySettings;
  updated_at: string;
}
