"use client";

import { useActionState, useState } from "react";
import { submitPaymentAction, type PaymentActionState } from "@/app/orders/[id]/actions";
import { peso } from "@/lib/format";

const METHODS = [
  { value: "gcash", label: "GCash" },
  { value: "bank_transfer", label: "Online Bank Transfer" },
  { value: "cod", label: "Cash on Delivery" },
  { value: "cheque", label: "Cheque" },
] as const;

export function PaymentForm({ orderId, total }: { orderId: string; total: number }) {
  const action = submitPaymentAction.bind(null, orderId);
  const [state, formAction, pending] = useActionState<PaymentActionState, FormData>(action, undefined);
  const [method, setMethod] = useState<(typeof METHODS)[number]["value"]>("gcash");

  if (state?.success) {
    return (
      <div className="bg-accent-soft border border-accent-soft-line rounded-2xl p-6 text-center">
        <p className="font-display text-lg font-semibold text-accent-ink mb-1">Payment submitted</p>
        <p className="text-sm text-ink-soft">Waiting for manager verification. This page will update automatically.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="bg-bg-raised border border-line rounded-2xl p-5 flex flex-col gap-4">
      <h2 className="font-display font-semibold text-lg">Pay this order</h2>
      <input type="hidden" name="amount" value={total} />

      <div className="grid grid-cols-2 gap-2">
        {METHODS.map((m) => (
          <button
            type="button"
            key={m.value}
            onClick={() => setMethod(m.value)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${
              method === m.value ? "bg-accent text-white border-accent" : "border-line text-ink-soft"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <input type="hidden" name="method" value={method} />

      {(method === "gcash" || method === "bank_transfer") && (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Transaction screenshot *</span>
          <input name="screenshot" type="file" accept="image/*" required className="text-sm" />
        </label>
      )}

      {method === "cheque" && (
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm col-span-2">
            <span className="font-medium">Cheque number *</span>
            <input name="cheque_number" required className="rounded-md border border-line px-2.5 py-2 outline-none focus:border-accent" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Bank *</span>
            <input name="cheque_bank" required className="rounded-md border border-line px-2.5 py-2 outline-none focus:border-accent" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Date *</span>
            <input name="cheque_date" type="date" required className="rounded-md border border-line px-2.5 py-2 outline-none focus:border-accent" />
          </label>
        </div>
      )}

      {method === "cod" && (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Notes (optional)</span>
          <textarea name="cod_notes" rows={2} className="rounded-md border border-line px-2.5 py-2 outline-none focus:border-accent" />
        </label>
      )}

      <div className="flex items-center justify-between text-sm border-t border-line pt-3">
        <span className="text-ink-soft">Amount due</span>
        <span className="font-data font-semibold text-base">{peso(total)}</span>
      </div>

      {state?.error && <p className="text-sm text-critical">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent text-white font-semibold py-2.5 hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Pay"}
      </button>
    </form>
  );
}
