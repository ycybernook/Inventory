-- ============================================================================
-- Owner-only discounts. A dedicated RPC (rather than a raw `update orders`)
-- so the total is always recomputed consistently and the discount can only
-- be applied while the order hasn't been paid yet.
-- ============================================================================

create or replace function apply_order_discount(
  p_order_id uuid,
  p_discount_amount numeric,
  p_discount_reason text default null
)
returns orders
language plpgsql security definer set search_path = public as $$
declare
  v_order orders;
  v_uid uuid := auth.uid();
begin
  if auth_role() <> 'owner' then
    raise exception 'Only an owner can apply discounts';
  end if;

  if p_discount_amount < 0 then
    raise exception 'Discount amount cannot be negative';
  end if;

  select * into v_order from orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;

  if v_order.status not in ('pending_approval', 'for_payment') then
    raise exception 'Discounts can only be applied before payment is submitted';
  end if;

  if p_discount_amount > v_order.subtotal then
    raise exception 'Discount cannot exceed the order subtotal';
  end if;

  update orders set
    discount_amount = p_discount_amount,
    discount_reason = p_discount_reason,
    discount_applied_by = v_uid,
    total = subtotal - p_discount_amount
  where id = p_order_id
  returning * into v_order;

  insert into order_status_history (order_id, from_status, to_status, changed_by, note)
  values (p_order_id, v_order.status, v_order.status,
    v_uid, 'Discount applied: ' || p_discount_amount::text ||
      case when p_discount_reason is not null then ' (' || p_discount_reason || ')' else '' end);

  return v_order;
end;
$$;

revoke execute on function apply_order_discount(uuid, numeric, text) from public;
grant execute on function apply_order_discount(uuid, numeric, text) to authenticated;
