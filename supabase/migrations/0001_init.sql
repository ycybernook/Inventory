-- ============================================================================
-- JR Hardware Inventory System — initial schema
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type user_role as enum ('customer', 'employee', 'manager', 'owner');

create type order_status as enum (
  'pending_approval',
  'for_payment',
  'paid',
  'for_fulfillment',
  'for_delivery',
  'in_transit',
  'for_confirmation',
  'completed',
  'cancelled',
  'rejected'
);

create type payment_method as enum ('gcash', 'bank_transfer', 'cod', 'cheque');

create type order_source as enum ('customer_online', 'employee_walkin');

-- ---------------------------------------------------------------------------
-- Profiles (extends auth.users)
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'customer',
  full_name text not null,
  address text,
  contact_number text not null,
  email text,
  email_opted_out boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- customers: email required unless explicitly skipped
-- employees/managers/owners: full_name, address, contact_number required; email optional
alter table profiles add constraint profiles_customer_email_chk
  check (role <> 'customer' or email_opted_out or email is not null);

alter table profiles add constraint profiles_staff_address_chk
  check (role = 'customer' or address is not null);

create index profiles_role_idx on profiles(role);

-- ---------------------------------------------------------------------------
-- Categories & Products (Inventory Catalog)
-- ---------------------------------------------------------------------------

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  description text,
  category_id uuid references categories(id) on delete set null,
  unit text not null default 'pc',
  price numeric(12,2) not null check (price >= 0),
  cost numeric(12,2) check (cost >= 0),
  image_path text,
  stock_qty int not null default 0 check (stock_qty >= 0),
  reorder_point int not null default 10 check (reorder_point >= 0),
  is_active boolean not null default true,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_idx on products(category_id);
create index products_active_idx on products(is_active);
create index products_low_stock_idx on products(stock_qty, reorder_point);

create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  change_qty int not null,
  reason text not null, -- 'order_deduction' | 'manual_adjustment' | 'restock'
  order_id uuid,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index inventory_movements_product_idx on inventory_movements(product_id);

-- ---------------------------------------------------------------------------
-- Cart
-- ---------------------------------------------------------------------------

create table carts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (owner_id)
);

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  qty int not null check (qty > 0),
  created_at timestamptz not null default now(),
  unique (cart_id, product_id)
);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  source order_source not null,
  status order_status not null default 'pending_approval',

  -- customer link (online orders)
  customer_id uuid references profiles(id),

  -- walk-in details (employee-initiated orders)
  walkin_full_name text,
  walkin_address text,
  walkin_contact_number text,
  walkin_email text,

  created_by uuid not null references profiles(id),

  subtotal numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  discount_reason text,
  discount_applied_by uuid references profiles(id),
  total numeric(12,2) not null default 0,

  approved_by uuid references profiles(id),
  approved_at timestamptz,
  rejected_reason text,

  payment_method payment_method,
  payment_submitted_at timestamptz,
  acknowledgement_number text,
  payment_verified_by uuid references profiles(id),
  payment_verified_at timestamptz,
  receipt_path text,
  receipt_issued_by uuid references profiles(id),
  receipt_issued_at timestamptz,

  fulfilled_by uuid references profiles(id),
  fulfilled_at timestamptz,

  delivery_scheduled_at timestamptz,
  delivery_scheduled_by uuid references profiles(id),
  in_transit_at timestamptz,

  confirmation_pending_at timestamptz, -- when marked "For Confirmation" — starts the 3-day auto-complete clock
  received_at timestamptz,             -- customer tapped "Order Received"
  completed_at timestamptz,
  completed_auto boolean not null default false,

  cancelled_at timestamptz,
  cancelled_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint orders_customer_or_walkin_chk check (
    (source = 'customer_online' and customer_id is not null)
    or (source = 'employee_walkin' and walkin_full_name is not null and walkin_address is not null and walkin_contact_number is not null)
  )
);

create index orders_status_idx on orders(status);
create index orders_customer_idx on orders(customer_id);
create index orders_created_by_idx on orders(created_by);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  sku_snapshot text not null,
  name_snapshot text not null,
  unit_snapshot text not null,
  price_snapshot numeric(12,2) not null,
  qty int not null check (qty > 0),
  line_total numeric(12,2) not null
);

create index order_items_order_idx on order_items(order_id);

create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  from_status order_status,
  to_status order_status not null,
  changed_by uuid references profiles(id),
  note text,
  created_at timestamptz not null default now()
);

create table payment_proofs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  method payment_method not null,
  screenshot_path text,        -- gcash / bank transfer
  cheque_number text,
  cheque_bank text,
  cheque_date date,
  cod_notes text,
  amount numeric(12,2) not null,
  submitted_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Timesheets
-- ---------------------------------------------------------------------------

create table timesheets (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references profiles(id) on delete cascade,
  clock_in timestamptz not null default now(),
  clock_out timestamptz,
  created_at timestamptz not null default now()
);

create index timesheets_employee_idx on timesheets(employee_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_set_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger products_set_updated_at before update on products
  for each row execute function set_updated_at();
create trigger orders_set_updated_at before update on orders
  for each row execute function set_updated_at();
