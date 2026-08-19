"use client";

import { useActionState, useEffect, useRef } from "react";
import { applyDiscountAction } from "@/app/orders/[id]/actions";
import { peso } from "@/lib/format";
import { useToast } from "@/components/toast-provider";

export function DiscountForm({
  orderId,
  subtotal,
  currentDiscount,
  currentReason,
}: {
  orderId: string;
  subtotal: number;
  currentDiscount: number;
  currentReason: string | null;
}) {
  const action = applyDiscountAction.bind(null, orderId);
  const [state, formAction, pending] = useActionState(action, undefined);
  const showToast = useToast();
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) {
      if (state?.error) {
        showToast(state.error, "error");
      } else {
        showToast("Discount applied.", "success");
      }
    }
    wasPending.current = pending;
  }, [pending, state, showToast]);

  return (
    <form action={formAction} className="bg-bg-raised border border-line rounded-2xl p-5 flex flex-col gap-3">
      <h2 className="font-display font-semibold text-lg">Discount</h2>
      <p className="text-xs text-ink-faint">Owner only. Subtotal: {peso(subtotal)}</p>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Discount amount (₱)</span>
        <input
          name="discount_amount"
          type="number"
          min={0}
          max={subtotal}
          step="0.01"
          defaultValue={currentDiscount || undefined}
          className="rounded-lg border border-line bg-bg px-3 py-2 outline-none focus:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Reason (optional)</span>
        <input
          name="discount_reason"
          defaultValue={currentReason ?? ""}
          className="rounded-lg border border-line bg-bg px-3 py-2 outline-none focus:border-accent"
        />
      </label>
      {state?.error && <p className="text-sm text-critical">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent text-white font-semibold py-2 text-sm hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Applying…" : "Apply discount"}
      </button>
    </form>
  );
}
