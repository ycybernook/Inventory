-- ============================================================================
-- Schedule the "3 days with no confirmation -> auto-complete" rule via
-- pg_cron, so it runs entirely inside Postgres with no external cron
-- (Vercel Cron, etc.) or service-role key required.
-- ============================================================================

create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'auto-complete-stale-confirmations',
  '0 * * * *', -- hourly
  $$select public.auto_complete_stale_confirmations();$$
);
