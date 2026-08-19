import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Header } from "@/components/header";
import { StatusBadge } from "@/components/status-badge";
import { peso, formatDate } from "@/lib/format";
import type { Order } from "@/lib/database.types";
import Link from "next/link";

export default async function OrdersPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .or(`customer_id.eq.${profile.id},created_by.eq.${profile.id}`)
    .order("created_at", { ascending: false });

  return (
    <>
      <Header profile={profile} />
      <main className="max-w-4xl mx-auto px-6 py-8 flex-1 w-full">
        <h1 className="font-display text-2xl font-semibold mb-6">My Orders</h1>

        {!orders || orders.length === 0 ? (
          <div className="bg-bg-raised border border-line rounded-2xl p-12 text-center text-ink-soft">
            <p className="font-display text-lg text-ink mb-1">No orders yet</p>
            <p className="mb-4">Orders you create will show up here.</p>
            <Link href="/catalog" className="inline-block rounded-lg bg-accent text-white font-semibold px-4 py-2 text-sm">
              Browse catalog
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {(orders as Order[]).map((o) => (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                className="bg-bg-raised border border-line rounded-xl p-4 flex items-center justify-between gap-4 hover:border-line-strong hover:shadow-sm transition"
              >
                <div>
                  <p className="font-data font-semibold text-sm">{o.order_number}</p>
                  <p className="text-xs text-ink-faint">{formatDate(o.created_at)}</p>
                </div>
                <StatusBadge status={o.status} />
                <p className="font-data font-semibold w-24 text-right">{peso(o.total)}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
