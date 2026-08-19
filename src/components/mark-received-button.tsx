"use client";

import { useTransition } from "react";
import { markReceivedAction } from "@/app/orders/[id]/actions";

export function MarkReceivedButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => markReceivedAction(orderId))}
      disabled={pending}
      className="rounded-lg bg-accent text-white font-semibold py-2.5 px-5 hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Confirming…" : "Order Received"}
    </button>
  );
}
