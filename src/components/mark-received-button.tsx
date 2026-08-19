"use client";

import { useTransition } from "react";
import { markReceivedAction } from "@/app/orders/[id]/actions";
import { useToast } from "@/components/toast-provider";

export function MarkReceivedButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  const showToast = useToast();

  function handleClick() {
    startTransition(async () => {
      try {
        await markReceivedAction(orderId);
        showToast("Order marked as received. Thanks!", "success");
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Could not confirm receipt.", "error");
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="rounded-lg bg-accent text-white font-semibold py-2.5 px-5 hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Confirming…" : "Order Received"}
    </button>
  );
}
