import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Header } from "@/components/header";
import { StatusBadge } from "@/components/status-badge";
import { peso, formatDate } from "@/lib/format";
import { ORDER_WORKFLOW, ORDER_STATUS_META } from "@/lib/order-status";
import type { Order, OrderItem, OrderStatusHistory } from "@/lib/database.types";
import { PaymentForm } from "@/components/payment-form";
import { MarkReceivedButton } from "@/components/mark-received-button";
import { DiscountForm } from "@/components/discount-form";

export default async function OrderDetailPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: order } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order) notFound();

  const [{ data: items }, { data: history }] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", id),
    supabase.from("order_status_history").select("*").eq("order_id", id).order("created_at"),
  ]);

  const o = order as Order;
  const isOwnerOfOrder = o.customer_id === profile.id || o.created_by === profile.id;
  const currentIdx = ORDER_WORKFLOW.indexOf(o.status);

  return (
    <>
      <Header profile={profile} />
      <main className="max-w-4xl mx-auto px-6 py-8 flex-1 w-full">
        <div className="flex items-center justify-between gap-4 mb-1 flex-wrap">
          <h1 className="font-display text-2xl font-semibold font-data">{o.order_number}</h1>
          <StatusBadge status={o.status} />
        </div>
        <p className="text-sm text-ink-soft mb-6">{formatDate(o.created_at)}</p>

        {currentIdx >= 0 && (
          <ol className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
            {ORDER_WORKFLOW.map((s, i) => (
              <li key={s} className="flex items-center gap-1 flex-shrink-0">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${i <= currentIdx ? "bg-accent" : "bg-line-strong"}`}
                  title={ORDER_STATUS_META[s].label}
                />
                {i < ORDER_WORKFLOW.length - 1 && (
                  <span className={`h-0.5 w-6 ${i < currentIdx ? "bg-accent" : "bg-line-strong"}`} />
                )}
              </li>
            ))}
          </ol>
        )}

        <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
          <div className="flex flex-col gap-6">
            <div className="bg-bg-raised border border-line rounded-2xl divide-y divide-line">
              {(items as OrderItem[] | null)?.map((it) => (
                <div key={it.id} className="flex items-center justify-between p-4 text-sm">
                  <div>
                    <p className="font-semibold">{it.name_snapshot}</p>
                    <p className="text-xs text-ink-faint font-data">
                      {it.sku_snapshot} · {it.qty} {it.unit_snapshot} × {peso(it.price_snapshot)}
                    </p>
                  </div>
                  <p className="font-data font-semibold">{peso(it.line_total)}</p>
                </div>
              ))}
              <div className="p-4 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm text-ink-soft">
                  <span>Subtotal</span>
                  <span className="font-data">{peso(o.subtotal)}</span>
                </div>
                {o.discount_amount > 0 && (
                  <div className="flex items-center justify-between text-sm text-good">
                    <span>Discount{o.discount_reason ? ` — ${o.discount_reason}` : ""}</span>
                    <span className="font-data">−{peso(o.discount_amount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between font-semibold pt-1.5 border-t border-line">
                  <span>Total</span>
                  <span className="font-data">{peso(o.total)}</span>
                </div>
              </div>
            </div>

            {history && history.length > 0 && (
              <div className="bg-bg-raised border border-line rounded-2xl p-5">
                <h2 className="font-display font-semibold text-lg mb-3">History</h2>
                <ul className="flex flex-col gap-2 text-sm">
                  {(history as OrderStatusHistory[]).map((h) => (
                    <li key={h.id} className="flex items-center justify-between text-ink-soft">
                      <span>
                        {ORDER_STATUS_META[h.to_status].label}
                        {h.note ? ` — ${h.note}` : ""}
                      </span>
                      <span className="font-data text-xs">{formatDate(h.created_at)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {profile.role === "owner" && ["pending_approval", "for_payment"].includes(o.status) && (
              <DiscountForm
                orderId={o.id}
                subtotal={o.subtotal}
                currentDiscount={o.discount_amount}
                currentReason={o.discount_reason}
              />
            )}

            {isOwnerOfOrder && o.status === "for_payment" && <PaymentForm orderId={o.id} total={o.total} />}

            {isOwnerOfOrder && o.status === "for_confirmation" && (
              <div className="bg-bg-raised border border-line rounded-2xl p-5 flex flex-col gap-3">
                <h2 className="font-display font-semibold text-lg">Delivered?</h2>
                <p className="text-sm text-ink-soft">
                  Confirm you&rsquo;ve received this order. If not confirmed within 3 days it will be marked complete automatically.
                </p>
                <MarkReceivedButton orderId={o.id} />
              </div>
            )}

            {o.receipt_issued_at && (
              <a
                href={`/orders/${o.id}/receipt`}
                className="rounded-lg border border-line-strong bg-bg-raised text-center font-semibold py-2.5 text-sm hover:bg-accent-soft"
              >
                View / print receipt
              </a>
            )}

            <div className="bg-bg-raised border border-line rounded-2xl p-5 text-sm text-ink-soft">
              <p className="font-medium text-ink mb-1">{ORDER_STATUS_META[o.status].label}</p>
              <p>{ORDER_STATUS_META[o.status].description}</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
