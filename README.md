# JR Hardware & Supply — Inventory System

Multi-role inventory, catalog, and order-management system for a hardware &
supply retailer, built on **Next.js 16** (App Router) + **Supabase**
(Postgres, Auth, Storage), deployed on **Vercel**.

## What's here

- **Catalog** — public product browsing with live stock badges, category
  filters, and search. Real-time-ish via Next.js revalidation on every
  cart/order mutation.
- **Roles** — `customer`, `employee`, `manager`, `owner`, enforced with
  Postgres Row Level Security, not just UI checks.
- **Cart & checkout** — customers order online; employees/managers/owners can
  take walk-in orders on a customer's behalf.
- **Order workflow** — Pending Approval → For Payment → Paid → For
  Fulfillment → For Delivery → In Transit → For Confirmation → Completed
  (or Rejected/Cancelled), all enforced server-side by a single Postgres
  function (`transition_order_status`) so a status can't be skipped or
  set by the wrong role. Inventory is deducted exactly once, at the
  For Fulfillment → For Delivery step.
- **Payments** — GCash / bank transfer (screenshot upload), cheque (details
  form), COD (notes) — proof-upload + manager verification, no live payment
  gateway.
- **Dashboards** — low-stock / out-of-stock alerts surfaced for
  employee/manager/owner, plus order-queue counts.
- **Timesheets** — employee clock in/out.
- **Admin** — manager/owner can manage products (owner-only delete);
  owner can create/edit/deactivate/delete staff accounts.
- **Account** — every user can update their own password and contact number.
- **Signup** — customers sign up with email (OTP-verified) or, via a "no
  email" checkbox, without one.

## Not yet built (flagged in the original spec, left for a follow-up pass)

- PDF receipt generation (a `receipt_path` placeholder is stamped, but no
  actual PDF is rendered yet)
- Reports / CSV-XLSX export
- Discounts UI (schema supports it: `orders.discount_amount` /
  `discount_reason`, owner-only)
- The 3-day auto-complete-from-"For Confirmation" job
  (`auto_complete_stale_confirmations()` exists as a SQL function — needs a
  scheduled trigger; see below)
- Delivery scheduling detail (courier name/tracking) — currently just a
  timestamp

## Setup

### 1. Supabase project

Create a project at [supabase.com](https://supabase.com), then run the
migrations in order against it (SQL Editor, or `supabase db push` if you use
the CLI):

```
supabase/migrations/0001_init.sql
supabase/migrations/0002_rls.sql
supabase/migrations/0003_functions.sql
supabase/migrations/0004_auth_trigger.sql
supabase/migrations/0005_storage.sql
```

Then seed example catalog data:

```
supabase/seed.sql
```

**Auth settings** (Supabase Dashboard → Authentication → Emails):
- Enable "Confirm email" for the OTP signup flow to matter.
- The default confirmation email template includes `{{ .Token }}` — the
  6-digit code your customers enter on `/signup/verify`. Customize the
  template if you want, just keep the token visible.

**Scheduled job** — the 3-day auto-complete rule needs something to call
`select auto_complete_stale_confirmations();` on a schedule. Easiest options:
a Supabase Cron (`pg_cron`) job, or a Vercel Cron hitting a small API route
that calls the RPC. Neither is wired up yet.

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The service role key is **server-only** — it powers staff-account creation
in `/admin/users` via the Supabase Admin API. Never expose it to the
browser; set it in Vercel's server-only env vars, not `NEXT_PUBLIC_*`.

### 3. Create the first owner account

There's no public signup for staff — only customers self-signup. Create your
first `owner` account directly in Supabase (SQL Editor):

```sql
-- After creating the auth user via Dashboard → Authentication → Users → Add user
update profiles set role = 'owner', address = 'HQ', is_active = true
where id = '<the user id>';
```

From then on, that owner can create employee/manager/owner accounts from
`/admin/users`.

### 4. Run locally

```bash
npm install
npm run dev
```

### 5. Deploy

Push to GitHub, import the repo in Vercel, set the three environment
variables above, and deploy.

## Notes on the data model

See `supabase/migrations/0001_init.sql` for the full schema. Key design
choices:

- **Customers without email** get a synthetic, never-delivered address
  (`cust-<digits>@no-email.internal`) so Supabase Auth still has a unique
  identifier — see `src/lib/auth-email.ts`. A DB trigger auto-confirms these
  accounts since there's no inbox to send a confirmation to.
- **Order workflow transitions** all go through
  `transition_order_status(order_id, new_status, note)`, a `security
  definer` Postgres function — this is the single place that checks "is
  this role allowed to make this transition from this status," so the rules
  can't be bypassed by calling `update orders ...` directly (RLS on
  `orders` still exists as a second layer, but the workflow logic lives in
  the function).
