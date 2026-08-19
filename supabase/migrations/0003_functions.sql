-- ============================================================================
-- Order numbering, workflow transitions, inventory deduction, auto-complete
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Order numbers: JR-YYYYMMDD-#### (sequential per day)
-- ---------------------------------------------------------------------------

create sequence if not exists order_number_seq;

create or replace function generate_order_number()
returns trigger language plpgsql as $$
begin
  if new.order_number is null then
    new.order_number := 'JR-' || to_char(now(), 'YYYYMMDD') || '-' ||
      lpad(nextval('order_number_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger orders_generate_number before insert on orders
  for each row execute function generate_order_number();

-- ---------------------------------------------------------------------------
-- transition_order_status — single entry point for moving an order through
-- the workflow. Validates the actor's role against the requested transition,
-- stamps the relevant timestamp columns, records history, and (only on the
-- for_fulfillment -> for_delivery step) deducts inventory exactly once.
-- ---------------------------------------------------------------------------

create or replace function transition_order_status(
  p_order_id uuid,
  p_new_status order_status,
  p_note text default null
)
returns orders
language plpgsql security definer set search_path = public as $$
declare
  v_order orders;
  v_role user_role := auth_role();
  v_uid uuid := auth.uid();
  v_item record;
begin
  select * into v_order from orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;

  -- ---- permission + valid-transition matrix ------------------------------
  if p_new_status = 'for_payment' then
    if v_order.status <> 'pending_approval' or v_role not in ('manager','owner') then
      raise exception 'Cannot approve order from status %', v_order.status;
    end if;
    v_order.approved_by := v_uid;
    v_order.approved_at := now();

  elsif p_new_status = 'rejected' then
    if v_order.status <> 'pending_approval' or v_role not in ('manager','owner') then
      raise exception 'Cannot reject order from status %', v_order.status;
    end if;
    v_order.rejected_reason := p_note;

  elsif p_new_status = 'paid' then
    if v_order.status <> 'for_payment' then
      raise exception 'Order must be For Payment to mark paid';
    end if;
    if not (v_order.customer_id = v_uid or v_order.created_by = v_uid or v_role in ('manager','owner')) then
      raise exception 'Not authorized to submit payment for this order';
    end if;
    v_order.payment_submitted_at := now();
    v_order.acknowledgement_number := coalesce(p_note, 'ACK-' || to_char(now(),'YYYYMMDDHH24MISS'));

  elsif p_new_status = 'for_fulfillment' then
    if v_order.status <> 'paid' or v_role not in ('manager','owner') then
      raise exception 'Payment must be verified by a manager before fulfillment';
    end if;
    v_order.payment_verified_by := v_uid;
    v_order.payment_verified_at := now();
    v_order.receipt_issued_by := v_uid;
    v_order.receipt_issued_at := now();
    v_order.receipt_path := coalesce(v_order.receipt_path, 'receipts/' || v_order.order_number || '.pdf');

  elsif p_new_status = 'for_delivery' then
    if v_order.status <> 'for_fulfillment' or v_role not in ('employee','manager','owner') then
      raise exception 'Order must be For Fulfillment before it can be completed for delivery';
    end if;
    v_order.fulfilled_by := v_uid;
    v_order.fulfilled_at := now();

    -- deduct inventory exactly once, for every line item
    for v_item in select * from order_items where order_id = p_order_id loop
      update products set stock_qty = stock_qty - v_item.qty
        where id = v_item.product_id;
      insert into inventory_movements (product_id, change_qty, reason, order_id, created_by)
        values (v_item.product_id, -v_item.qty, 'order_deduction', p_order_id, v_uid);
    end loop;

  elsif p_new_status = 'in_transit' then
    if v_order.status <> 'for_delivery' or v_role not in ('manager','owner') then
      raise exception 'Order must be For Delivery before scheduling transit';
    end if;
    v_order.delivery_scheduled_at := now();
    v_order.delivery_scheduled_by := v_uid;
    v_order.in_transit_at := now();

  elsif p_new_status = 'for_confirmation' then
    if v_order.status <> 'in_transit' or v_role not in ('manager','owner') then
      raise exception 'Order must be In Transit before confirmation';
    end if;
    v_order.confirmation_pending_at := now();

  elsif p_new_status = 'completed' then
    if v_order.status <> 'for_confirmation' then
      raise exception 'Order must be For Confirmation before completion';
    end if;
    if not (v_order.customer_id = v_uid or v_role in ('manager','owner')) then
      raise exception 'Not authorized to complete this order';
    end if;
    v_order.received_at := now();
    v_order.completed_at := now();
    v_order.completed_auto := false;

  elsif p_new_status = 'cancelled' then
    if v_order.status not in ('pending_approval','for_payment') or v_role not in ('manager','owner') then
      raise exception 'Order can only be cancelled before payment, by a manager or owner';
    end if;
    v_order.cancelled_at := now();
    v_order.cancelled_reason := p_note;

  else
    raise exception 'Unsupported transition to %', p_new_status;
  end if;

  insert into order_status_history (order_id, from_status, to_status, changed_by, note)
    values (p_order_id, v_order.status, p_new_status, v_uid, p_note);

  v_order.status := p_new_status;

  update orders set
    status = v_order.status,
    approved_by = v_order.approved_by, approved_at = v_order.approved_at,
    rejected_reason = v_order.rejected_reason,
    payment_submitted_at = v_order.payment_submitted_at, acknowledgement_number = v_order.acknowledgement_number,
    payment_verified_by = v_order.payment_verified_by, payment_verified_at = v_order.payment_verified_at,
    receipt_path = v_order.receipt_path, receipt_issued_by = v_order.receipt_issued_by, receipt_issued_at = v_order.receipt_issued_at,
    fulfilled_by = v_order.fulfilled_by, fulfilled_at = v_order.fulfilled_at,
    delivery_scheduled_at = v_order.delivery_scheduled_at, delivery_scheduled_by = v_order.delivery_scheduled_by, in_transit_at = v_order.in_transit_at,
    confirmation_pending_at = v_order.confirmation_pending_at,
    received_at = v_order.received_at, completed_at = v_order.completed_at, completed_auto = v_order.completed_auto,
    cancelled_at = v_order.cancelled_at, cancelled_reason = v_order.cancelled_reason
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

-- ---------------------------------------------------------------------------
-- Auto-complete orders left "For Confirmation" for 3+ days.
-- Call from a scheduled job (pg_cron or a Vercel/Supabase cron hitting an
-- edge function that runs `select auto_complete_stale_confirmations();`).
-- ---------------------------------------------------------------------------

create or replace function auto_complete_stale_confirmations()
returns int language plpgsql security definer set search_path = public as $$
declare
  v_count int;
begin
  with stale as (
    select id from orders
    where status = 'for_confirmation'
      and confirmation_pending_at < now() - interval '3 days'
  )
  update orders set
    status = 'completed',
    completed_at = now(),
    completed_auto = true
  where id in (select id from stale);

  get diagnostics v_count = row_count;

  insert into order_status_history (order_id, from_status, to_status, changed_by, note)
  select id, 'for_confirmation', 'completed', null, 'Auto-completed after 3 days with no customer confirmation'
  from orders where status = 'completed' and completed_auto = true
    and completed_at > now() - interval '1 minute';

  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- Cart -> Order checkout (customer or employee walk-in)
-- ---------------------------------------------------------------------------

create or replace function checkout_cart(
  p_walkin_full_name text default null,
  p_walkin_address text default null,
  p_walkin_contact_number text default null,
  p_walkin_email text default null
)
returns orders
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_role user_role := auth_role();
  v_cart_id uuid;
  v_order orders;
  v_subtotal numeric(12,2) := 0;
  v_item record;
  v_source order_source;
  v_customer_id uuid;
begin
  select id into v_cart_id from carts where owner_id = v_uid;
  if v_cart_id is null then
    raise exception 'Cart is empty';
  end if;

  if not exists (select 1 from cart_items where cart_id = v_cart_id) then
    raise exception 'Cart is empty';
  end if;

  if v_role = 'customer' then
    v_source := 'customer_online';
    v_customer_id := v_uid;
  else
    v_source := 'employee_walkin';
    if p_walkin_full_name is null or p_walkin_address is null or p_walkin_contact_number is null then
      raise exception 'Walk-in customer full name, address, and contact number are required';
    end if;
  end if;

  select coalesce(sum(ci.qty * p.price), 0) into v_subtotal
  from cart_items ci join products p on p.id = ci.product_id
  where ci.cart_id = v_cart_id;

  insert into orders (source, customer_id, walkin_full_name, walkin_address, walkin_contact_number, walkin_email,
                       created_by, subtotal, total, status)
  values (v_source, v_customer_id, p_walkin_full_name, p_walkin_address, p_walkin_contact_number, p_walkin_email,
          v_uid, v_subtotal, v_subtotal, 'pending_approval')
  returning * into v_order;

  for v_item in
    select ci.qty, p.id as product_id, p.sku, p.name, p.unit, p.price
    from cart_items ci join products p on p.id = ci.product_id
    where ci.cart_id = v_cart_id
  loop
    insert into order_items (order_id, product_id, sku_snapshot, name_snapshot, unit_snapshot, price_snapshot, qty, line_total)
    values (v_order.id, v_item.product_id, v_item.sku, v_item.name, v_item.unit, v_item.price, v_item.qty, v_item.qty * v_item.price);
  end loop;

  insert into order_status_history (order_id, from_status, to_status, changed_by, note)
  values (v_order.id, null, 'pending_approval', v_uid, 'Order created');

  delete from cart_items where cart_id = v_cart_id;

  return v_order;
end;
$$;
