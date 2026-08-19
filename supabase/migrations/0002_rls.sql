-- ============================================================================
-- Row Level Security
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Helper functions (security definer, read own role without recursive RLS)
-- ---------------------------------------------------------------------------

create or replace function auth_role()
returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_staff()
returns boolean
language sql stable security definer set search_path = public as $$
  select auth_role() in ('employee', 'manager', 'owner');
$$;

create or replace function is_manager_up()
returns boolean
language sql stable security definer set search_path = public as $$
  select auth_role() in ('manager', 'owner');
$$;

create or replace function is_owner()
returns boolean
language sql stable security definer set search_path = public as $$
  select auth_role() = 'owner';
$$;

alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table inventory_movements enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_status_history enable row level security;
alter table payment_proofs enable row level security;
alter table timesheets enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create policy profiles_select_own on profiles for select
  using (id = auth.uid() or is_staff());

create policy profiles_update_own on profiles for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select role from profiles p where p.id = auth.uid()) -- cannot self-promote
  );

create policy profiles_staff_manage on profiles for all
  using (is_manager_up())
  with check (is_manager_up());

create policy profiles_insert_self on profiles for insert
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- categories & products — everyone can read active catalog; managers+ write; owner deletes
-- ---------------------------------------------------------------------------

create policy categories_read_all on categories for select using (true);
create policy categories_write_managers on categories for insert with check (is_manager_up());
create policy categories_update_managers on categories for update using (is_manager_up());
create policy categories_delete_owner on categories for delete using (is_owner());

create policy products_read_all on products for select using (true);
create policy products_insert_managers on products for insert with check (is_manager_up());
create policy products_update_managers on products for update using (is_manager_up());
create policy products_delete_owner on products for delete using (is_owner());

create policy inventory_movements_read_staff on inventory_movements for select using (is_staff());
create policy inventory_movements_insert_managers on inventory_movements for insert with check (is_manager_up());

-- ---------------------------------------------------------------------------
-- cart / cart_items — only the owner (customer or employee building a walk-in cart)
-- ---------------------------------------------------------------------------

create policy carts_own on carts for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy cart_items_own on cart_items for all
  using (exists (select 1 from carts c where c.id = cart_id and c.owner_id = auth.uid()))
  with check (exists (select 1 from carts c where c.id = cart_id and c.owner_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------

create policy orders_select on orders for select
  using (customer_id = auth.uid() or created_by = auth.uid() or is_staff());

create policy orders_insert on orders for insert
  with check (created_by = auth.uid());

-- customers may only update their own order to reflect payment submission / order-received;
-- staff (employee/manager/owner) can progress orders through the workflow.
create policy orders_update_customer on orders for update
  using (customer_id = auth.uid() and status in ('for_payment', 'for_confirmation'))
  with check (customer_id = auth.uid());

create policy orders_update_staff on orders for update
  using (is_staff())
  with check (is_staff());

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------

create policy order_items_select on order_items for select
  using (
    exists (
      select 1 from orders o
      where o.id = order_id
        and (o.customer_id = auth.uid() or o.created_by = auth.uid() or is_staff())
    )
  );

create policy order_items_insert on order_items for insert
  with check (
    exists (
      select 1 from orders o
      where o.id = order_id and (o.created_by = auth.uid() or is_staff())
    )
  );

-- ---------------------------------------------------------------------------
-- order_status_history — read by participants + staff; insert by staff/system
-- ---------------------------------------------------------------------------

create policy order_status_history_select on order_status_history for select
  using (
    exists (
      select 1 from orders o
      where o.id = order_id and (o.customer_id = auth.uid() or o.created_by = auth.uid() or is_staff())
    )
  );

create policy order_status_history_insert on order_status_history for insert
  with check (is_staff() or exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- payment_proofs — order participants can insert/read
-- ---------------------------------------------------------------------------

create policy payment_proofs_select on payment_proofs for select
  using (
    exists (
      select 1 from orders o
      where o.id = order_id and (o.customer_id = auth.uid() or o.created_by = auth.uid() or is_staff())
    )
  );

create policy payment_proofs_insert on payment_proofs for insert
  with check (
    submitted_by = auth.uid()
    and exists (
      select 1 from orders o
      where o.id = order_id and (o.customer_id = auth.uid() or o.created_by = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- timesheets — employee sees/creates own; manager+ sees all
-- ---------------------------------------------------------------------------

create policy timesheets_own on timesheets for all
  using (employee_id = auth.uid() or is_manager_up())
  with check (employee_id = auth.uid() or is_manager_up());
