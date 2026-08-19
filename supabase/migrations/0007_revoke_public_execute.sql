-- ============================================================================
-- Follow-up to 0006: Postgres grants EXECUTE to PUBLIC by default on
-- function creation, so revoking from anon/authenticated alone (0006) left
-- the PUBLIC grant in place and the advisor warnings unchanged. Revoke from
-- PUBLIC directly, then re-grant execute on checkout_cart/
-- transition_order_status to `authenticated` specifically, since those two
-- must stay callable by signed-in app users (they enforce their own
-- auth.uid()/role checks internally).
-- ============================================================================

revoke execute on function auth_role() from public;
revoke execute on function is_staff() from public;
revoke execute on function is_manager_up() from public;
revoke execute on function is_owner() from public;
revoke execute on function handle_new_user() from public;
revoke execute on function auto_complete_stale_confirmations() from public;
revoke execute on function checkout_cart(text, text, text, text) from public;
revoke execute on function transition_order_status(uuid, order_status, text) from public;

grant execute on function checkout_cart(text, text, text, text) to authenticated;
grant execute on function transition_order_status(uuid, order_status, text) to authenticated;
