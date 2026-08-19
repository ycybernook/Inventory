import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Header } from "@/components/header";
import { StatusBadge } from "@/components/status-badge";
import { peso, formatDate } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/database.types";
import { TransitionButton } from "@/components/transition-button";
import Link from "next/link";

const ACTIVE_STATUSES: OrderStatus[] = [
  "pending_approval",
  "for_payment",
  "paid",
  "for_fulfillment",
  "for_delivery",
  "in_transit",
  "for_confirmation",
];

export default async function AdminOrdersPage() {
  const profile = await requireRole(["employee", "manager", "owner"]);
  const supabase = await createClient();
  const isManagerUp = profile.role === "manager" || profile.role === "owner";

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .in("status", ACTIVE_STATUSES)
    .order("created_at", { ascending: true });

  const groups = ACTIVE_STATUSES.map((status) => ({
    status,
    orders: ((orders as Order[]) ?? []).filter((o) => o.status === status),
  })).filter((g) => g.orders.length > 0);

  return (
    <>
      <Header profile={profile} />
      <main className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full">
        <h1 className="font-display text-2xl font-semibold mb-1">Order Queue</h1>
        <p className="text-sm text-ink-soft mb-6">Orders currently moving through the workflow.</p>

        {groups.length === 0 && (
          <div className="bg-bg-raised border border-line rounded-2xl p-12 text-center text-ink-soft">
            No active orders right now.
          </div>
        )}

        <div className="flex flex-col gap-8">
          {groups.map((g) => (
            <section key={g.status}>
              <h2 className="text-xs uppercase tracking-wide text-ink-faint mb-2.5">
                {g.orders.length} order{g.orders.length === 1 ? "" : "s"} · {g.status.replace(/_/g, " ")}
              </h2>
              <div className="flex flex-col gap-2.5">
                {g.orders.map((o) => (
                  <div key={o.id} className="bg-bg-raised border border-line rounded-xl p-4 flex items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <Link href={`/orders/${o.id}`} className="font-data font-semibold text-sm hover:underline">
                        {o.order_number}
                      </Link>
                      <p className="text-xs text-ink-faint truncate">
                        {o.source === "employee_walkin" ? o.walkin_full_name : "Online customer"} · {formatDate(o.created_at)}
                      </p>
                    </div>
                    <p className="font-data font-semibold w-24 text-right hidden sm:block">{peso(o.total)}</p>
                    <StatusBadge status={o.status} />
                    <div className="flex gap-2">{renderActions(o, isManagerUp)}</div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}

function renderActions(o: Order, isManagerUp: boolean) {
  if (o.status === "pending_approval") {
    if (!isManagerUp) return <span className="text-xs text-ink-faint">Awaiting manager</span>;
    return (
      <>
        <TransitionButton orderId={o.id} to="for_payment" label="Approve" />
        <TransitionButton orderId={o.id} to="rejected" label="Reject" variant="danger" requireNote />
      </>
    );
  }
  if (o.status === "for_payment") {
    return <span className="text-xs text-ink-faint">Awaiting customer payment</span>;
  }
  if (o.status === "paid") {
    if (!isManagerUp) return <span className="text-xs text-ink-faint">Awaiting verification</span>;
    return <TransitionButton orderId={o.id} to="for_fulfillment" label="Verify payment & issue receipt" />;
  }
  if (o.status === "for_fulfillment") {
    return <TransitionButton orderId={o.id} to="for_delivery" label="Mark prepared" />;
  }
  if (o.status === "for_delivery") {
    if (!isManagerUp) return <span className="text-xs text-ink-faint">Awaiting delivery schedule</span>;
    return <TransitionButton orderId={o.id} to="in_transit" label="Hand to courier" />;
  }
  if (o.status === "in_transit") {
    if (!isManagerUp) return <span className="text-xs text-ink-faint">In transit</span>;
    return <TransitionButton orderId={o.id} to="for_confirmation" label="Delivery completed" />;
  }
  if (o.status === "for_confirmation") {
    return <span className="text-xs text-ink-faint">Awaiting customer confirmation</span>;
  }
  return null;
}
