import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { peso, formatDate } from "@/lib/format";
import type { Order, OrderItem } from "@/lib/database.types";
import { PrintButton } from "@/components/print-button";

export default async function ReceiptPage({ params }: PageProps<"/orders/[id]/receipt">) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: order } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order) notFound();

  const o = order as Order;
  const isParticipant = o.customer_id === profile.id || o.created_by === profile.id || profile.role !== "customer";
  if (!isParticipant || !o.receipt_issued_at) notFound();

  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", id);

  const billTo = o.source === "customer_online" ? profile.full_name : o.walkin_full_name;
  const billAddress = o.source === "customer_online" ? profile.address : o.walkin_address;

  return (
    <main className="min-h-dvh bg-bg py-10 px-4 print:bg-white print:p-0">
      <div className="max-w-xl mx-auto bg-bg-raised border border-line rounded-2xl p-8 print:border-0 print:shadow-none print:rounded-none">
        <div className="flex items-center justify-between mb-8 print:hidden">
          <span className="text-sm text-ink-soft">Official Receipt</span>
          <PrintButton />
        </div>

        <div className="flex items-center gap-3 mb-8">
          <span className="h-10 w-10 rounded-lg bg-accent grid place-items-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 9L12 4L20 9V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V9Z" stroke="#FBFBF7" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M9 20V13H15V20" stroke="#FBFBF7" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <div className="font-display font-semibold text-lg leading-none">JR Hardware & Supply</div>
            <div className="text-xs text-ink-soft mt-1">Official Receipt</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-8">
          <div>
            <p className="text-ink-faint text-xs uppercase tracking-wide mb-1">Bill to</p>
            <p className="font-medium">{billTo}</p>
            <p className="text-ink-soft">{billAddress}</p>
          </div>
          <div className="text-right">
            <p className="text-ink-faint text-xs uppercase tracking-wide mb-1">Receipt No.</p>
            <p className="font-data font-medium">{o.order_number}</p>
            <p className="text-ink-soft mt-2">{formatDate(o.receipt_issued_at)}</p>
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ink-faint border-b border-line">
              <th className="py-2 font-medium">Item</th>
              <th className="py-2 font-medium text-right">Qty</th>
              <th className="py-2 font-medium text-right">Price</th>
              <th className="py-2 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(items as OrderItem[] | null)?.map((it) => (
              <tr key={it.id}>
                <td className="py-2">{it.name_snapshot}</td>
                <td className="py-2 text-right font-data">{it.qty}</td>
                <td className="py-2 text-right font-data">{peso(it.price_snapshot)}</td>
                <td className="py-2 text-right font-data">{peso(it.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex flex-col gap-1.5 items-end text-sm mb-8">
          <div className="flex justify-between w-48">
            <span className="text-ink-soft">Subtotal</span>
            <span className="font-data">{peso(o.subtotal)}</span>
          </div>
          {o.discount_amount > 0 && (
            <div className="flex justify-between w-48 text-good">
              <span>Discount</span>
              <span className="font-data">−{peso(o.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between w-48 font-semibold text-base border-t border-line pt-1.5">
            <span>Total</span>
            <span className="font-data">{peso(o.total)}</span>
          </div>
        </div>

        <div className="text-sm text-ink-soft border-t border-line pt-4">
          <p>Payment method: {o.payment_method ?? "—"}</p>
          {o.acknowledgement_number && <p>Acknowledgement no.: {o.acknowledgement_number}</p>}
        </div>
      </div>
    </main>
  );
}
