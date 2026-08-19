-- ============================================================================
-- Auto-create a profile row whenever a new auth.users record appears.
-- Expects raw_user_meta_data: { full_name, contact_number, address?, role?,
-- email_opted_out? } set at signUp() time.
-- ============================================================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name, address, contact_number, email, email_opted_out, created_by)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer'),
    coalesce(new.raw_user_meta_data->>'full_name', 'Unnamed'),
    new.raw_user_meta_data->>'address',
    coalesce(new.raw_user_meta_data->>'contact_number', ''),
    case when coalesce((new.raw_user_meta_data->>'email_opted_out')::boolean, false)
      then null else new.email end,
    coalesce((new.raw_user_meta_data->>'email_opted_out')::boolean, false),
    (new.raw_user_meta_data->>'created_by')::uuid
  );

  -- Customers who skip email verification sign up with a synthetic,
  -- never-delivered address (see lib/auth-email.ts). There is no inbox to
  -- send an OTP to, so auto-confirm them instead of leaving the account
  -- stuck waiting on a confirmation email that will never arrive.
  if coalesce((new.raw_user_meta_data->>'email_opted_out')::boolean, false) then
    -- note: confirmed_at is a generated column (derived from email/phone
    -- confirmed_at) on current Supabase projects, so only set email_confirmed_at.
    update auth.users set email_confirmed_at = now()
      where id = new.id and email_confirmed_at is null;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
