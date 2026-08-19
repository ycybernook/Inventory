import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Header } from "@/components/header";
import { peso } from "@/lib/format";
import Link from "next/link";
import type { Product, Order } from "@/lib/database.types";
import { TimesheetWidget } from "@/components/timesheet-widget";

export default async function DashboardPage() {
  const profile = await requireRole(["employee", "manager", "owner"]);
  const supabase = await createClient();

  const [{ data: products }, { data: openOrders }, { data: openEntry }] = await Promise.all([
    supabase.from("products").select("*").eq("is_active", true),
    supabase
      .from("orders")
      .select("*")
      .not("status", "in", "(completed,cancelled,rejected)"),
    profile.role === "employee"
      ? supabase
          .from("timesheets")
          .select("id, clock_in")
          .eq("employee_id", profile.id)
          .is("clock_out", null)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const all = (products as Product[]) ?? [];
  const low = all.filter((p) => p.stock_qty > 0 && p.stock_qty <= p.reorder_point);
  const out = all.filter((p) => p.stock_qty === 0);
  const value = all.reduce((sum, p) => sum + p.price * p.stock_qty, 0);
  const orders = (openOrders as Order[]) ?? [];
  const pending = orders.filter((o) => o.status === "pending_approval").length;
  const forFulfillment = orders.filter((o) => o.status === "for_fulfillment").length;

  return (
    <>
      <Header profile={profile} />
      <main className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full flex flex-col gap-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-ink-soft">Welcome back, {profile.full_name.split(" ")[0]}.</p>
        </div>

        {profile.role === "employee" && <TimesheetWidget openEntry={openEntry as { id: string; clock_in: string } | null} />}

        {(low.length > 0 || out.length > 0) && (
          <div className="flex items-center gap-3 rounded-xl border border-warn-soft bg-warn-soft px-4 py-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-warn flex-shrink-0">
              <path d="M12 3L22 20H2L12 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M12 10V14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              <circle cx="12" cy="17.2" r="1" fill="currentColor" />
            </svg>
            <p className="text-sm">
              <strong className="text-warn">{low.length + out.length} items need attention</strong> —{" "}
              <span className="text-ink-soft">
                {[...out, ...low].slice(0, 4).map((p) => p.name).join(", ")}
                {low.length + out.length > 4 ? "…" : ""}
              </span>
            </p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile label="Active SKUs" value={all.length.toString()} />
          <StatTile label="Low Stock" value={low.length.toString()} tone="warn" />
          <StatTile label="Out of Stock" value={out.length.toString()} tone="critical" />
          <StatTile label="Inventory Value" value={peso(value)} tone="good" />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Link
            href="/admin/orders"
            className="bg-bg-raised border border-line rounded-2xl p-5 hover:border-line-strong hover:shadow-sm transition"
          >
            <p className="text-xs uppercase tracking-wide text-ink-faint mb-1">Pending Approval</p>
            <p className="font-display text-2xl font-semibold">{pending}</p>
            <p className="text-sm text-ink-soft mt-1">orders waiting for review</p>
          </Link>
          <Link
            href="/admin/orders"
            className="bg-bg-raised border border-line rounded-2xl p-5 hover:border-line-strong hover:shadow-sm transition"
          >
            <p className="text-xs uppercase tracking-wide text-ink-faint mb-1">For Fulfillment</p>
            <p className="font-display text-2xl font-semibold">{forFulfillment}</p>
            <p className="text-sm text-ink-soft mt-1">orders ready to prepare</p>
          </Link>
        </div>
      </main>
    </>
  );
}

function StatTile({ label, value, tone }: { label: string; value: string; tone?: "warn" | "critical" | "good" }) {
  const toneClass = tone === "warn" ? "text-warn" : tone === "critical" ? "text-critical" : tone === "good" ? "text-good" : "";
  return (
    <div className="bg-bg-raised border border-line rounded-2xl p-4">
      <p className="text-xs uppercase tracking-wide text-ink-faint mb-2">{label}</p>
      <p className={`font-display text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
