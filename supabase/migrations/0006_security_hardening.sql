-- ============================================================================
-- Security hardening — found by Supabase's advisor linter after the initial
-- migrations were applied:
--   1. `set_updated_at` / `generate_order_number` had a mutable search_path
--      (function_search_path_mutable).
--   2. Internal role-check helpers and the cron-only auto-complete function
--      were reachable as public RPCs via PostgREST, just because Postgres
--      grants EXECUTE to PUBLIC by default on function creation.
-- ============================================================================

create or replace function set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function generate_order_number()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.order_number is null then
    new.order_number := 'JR-' || to_char(now(), 'YYYYMMDD') || '-' ||
      lpad(nextval('order_number_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

-- Internal helpers/triggers — not meant to be called as public RPCs.
revoke execute on function auth_role() from public;
revoke execute on function is_staff() from public;
revoke execute on function is_manager_up() from public;
revoke execute on function is_owner() from public;
revoke execute on function handle_new_user() from public;

-- Cron/admin-only: end users must never trigger this directly.
revoke execute on function auto_complete_stale_confirmations() from public;

-- checkout_cart / transition_order_status must stay callable by signed-in
-- app users (they enforce their own auth.uid()/role checks internally) —
-- revoke the PUBLIC default grant, then re-grant to `authenticated` only.
revoke execute on function checkout_cart(text, text, text, text) from public;
revoke execute on function transition_order_status(uuid, order_status, text) from public;
grant execute on function checkout_cart(text, text, text, text) to authenticated;
grant execute on function transition_order_status(uuid, order_status, text) to authenticated;
