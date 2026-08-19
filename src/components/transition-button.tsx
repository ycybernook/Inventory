"use client";

import { useState, useTransition } from "react";
import type { OrderStatus } from "@/lib/database.types";
import { transitionOrderAction } from "@/app/admin/orders/actions";
import { useToast } from "@/components/toast-provider";

export function TransitionButton({
  orderId,
  to,
  label,
  variant = "primary",
  requireNote,
}: {
  orderId: string;
  to: OrderStatus;
  label: string;
  variant?: "primary" | "danger" | "ghost";
  requireNote?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const showToast = useToast();

  const classes =
    variant === "primary"
      ? "bg-accent text-white hover:opacity-90"
      : variant === "danger"
        ? "bg-critical-soft text-critical hover:bg-critical hover:text-white"
        : "border border-line-strong text-ink-soft hover:bg-accent-soft hover:text-ink";

  function handleClick() {
    let note: string | undefined;
    if (requireNote) {
      note = window.prompt("Reason (optional but recommended):") ?? undefined;
    }
    setError(null);
    startTransition(async () => {
      try {
        await transitionOrderAction(orderId, to, note);
        showToast(`${label} — done.`, "success");
      } catch (e) {
        const message = e instanceof Error ? e.message : "Action failed.";
        setError(message);
        showToast(message, "error");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={pending}
        className={`rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${classes}`}
      >
        {pending ? "Working…" : label}
      </button>
      {error && <span className="text-[11px] text-critical">{error}</span>}
    </div>
  );
}
