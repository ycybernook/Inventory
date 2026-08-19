-- ============================================================================
-- Fix: migration 0006/0007 revoked EXECUTE on the is_staff()/is_manager_up()/
-- is_owner()/auth_role() helper functions from `authenticated`, to close the
-- Supabase advisor's "public can call as RPC" warning.
--
-- That broke every RLS policy that references these helpers (including
-- profiles_select_own — `id = auth.uid() or is_staff()`), because a policy's
-- USING/WITH CHECK expression evaluates under the *querying role's own*
-- privileges, not as security definer. A signed-in user's session was
-- perfectly valid, but any query touching a table with one of these
-- policies (profiles, orders, timesheets, ...) silently errored, which
-- getCurrentProfile() treated as "not logged in" since it only checked
-- `data`, not `error`.
--
-- These functions are read-only, side-effect-free, and only return
-- information about the caller's own session — being callable directly by
-- `authenticated` as an RPC is not a real exposure. `anon` remains excluded.
-- ============================================================================

grant execute on function auth_role() to authenticated;
grant execute on function is_staff() to authenticated;
grant execute on function is_manager_up() to authenticated;
grant execute on function is_owner() to authenticated;
