export type UserRole = "customer" | "employee" | "manager" | "owner";

export type OrderStatus =
  | "pending_approval"
  | "for_payment"
  | "paid"
  | "for_fulfillment"
  | "for_delivery"
  | "in_transit"
  | "for_confirmation"
  | "completed"
  | "cancelled"
  | "rejected";

export type PaymentMethod = "gcash" | "bank_transfer" | "cod" | "cheque";
export type OrderSource = "customer_online" | "employee_walkin";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  address: string | null;
  contact_number: string;
  email: string | null;
  email_opted_out: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category_id: string | null;
  unit: string;
  price: number;
  cost: number | null;
  image_path: string | null;
  stock_qty: number;
  reorder_point: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CartRow {
  id: string;
  owner_id: string;
  created_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  qty: number;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  source: OrderSource;
  status: OrderStatus;
  customer_id: string | null;
  walkin_full_name: string | null;
  walkin_address: string | null;
  walkin_contact_number: string | null;
  walkin_email: string | null;
  created_by: string;
  subtotal: number;
  discount_amount: number;
  discount_reason: string | null;
  discount_applied_by: string | null;
  total: number;
  approved_by: string | null;
  approved_at: string | null;
  rejected_reason: string | null;
  payment_method: PaymentMethod | null;
  payment_submitted_at: string | null;
  acknowledgement_number: string | null;
  payment_verified_by: string | null;
  payment_verified_at: string | null;
  receipt_path: string | null;
  receipt_issued_by: string | null;
  receipt_issued_at: string | null;
  fulfilled_by: string | null;
  fulfilled_at: string | null;
  delivery_scheduled_at: string | null;
  delivery_scheduled_by: string | null;
  in_transit_at: string | null;
  confirmation_pending_at: string | null;
  received_at: string | null;
  completed_at: string | null;
  completed_auto: boolean;
  cancelled_at: string | null;
  cancelled_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  sku_snapshot: string;
  name_snapshot: string;
  unit_snapshot: string;
  price_snapshot: number;
  qty: number;
  line_total: number;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  changed_by: string | null;
  note: string | null;
  created_at: string;
}

export interface PaymentProof {
  id: string;
  order_id: string;
  method: PaymentMethod;
  screenshot_path: string | null;
  cheque_number: string | null;
  cheque_bank: string | null;
  cheque_date: string | null;
  cod_notes: string | null;
  amount: number;
  submitted_by: string;
  created_at: string;
}

export interface Timesheet {
  id: string;
  employee_id: string;
  clock_in: string;
  clock_out: string | null;
  created_at: string;
}

// Minimal Supabase Database shape — enough for the typed client without
// requiring a full `supabase gen types` run in this environment.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
