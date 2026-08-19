"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { peso } from "@/lib/format";
import { updateCartItemAction, removeCartItemAction, checkoutAction } from "@/app/cart/actions";

type Line = {
  id: string;
  qty: number;
  product: { id: string; name: string; sku: string; unit: string; price: number; stock_qty: number; image_path: string | null };
};

export function CartLines({ lines }: { lines: Line[] }) {
  const [, startTransition] = useTransition();

  return (
    <div className="bg-bg-raised border border-line rounded-2xl divide-y divide-line">
      {lines.map((line) => (
        <div key={line.id} className="flex items-center gap-4 p-4">
          <div className="h-16 w-16 rounded-lg bg-accent-soft grid place-items-center flex-shrink-0">
            {line.product.image_path && (
              <Image src={line.product.image_path} alt={line.product.name} width={40} height={40} className="w-3/5 h-3/5 object-contain" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{line.product.name}</p>
            <p className="text-xs text-ink-faint font-data">{line.product.sku} · {peso(line.product.price)}/{line.product.unit}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <StepButton
              label="Decrease"
              onClick={() => startTransition(() => updateCartItemAction(line.id, line.qty - 1))}
            >
              −
            </StepButton>
            <span className="font-data w-8 text-center text-sm">{line.qty}</span>
            <StepButton
              label="Increase"
              onClick={() => startTransition(() => updateCartItemAction(line.id, Math.min(line.qty + 1, line.product.stock_qty)))}
            >
              +
            </StepButton>
          </div>
          <p className="font-data font-semibold w-24 text-right">{peso(line.qty * line.product.price)}</p>
          <button
            onClick={() => startTransition(() => removeCartItemAction(line.id))}
            className="text-ink-faint hover:text-critical"
            aria-label={`Remove ${line.product.name}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

function StepButton({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="h-7 w-7 rounded-md border border-line-strong grid place-items-center text-sm hover:bg-accent-soft"
    >
      {children}
    </button>
  );
}

export function CheckoutPanel({ subtotal, isStaff }: { subtotal: number; isStaff: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [walkin, setWalkin] = useState({ full_name: "", address: "", contact_number: "", email: "" });

  function submit() {
    setError(null);
    if (isStaff && (!walkin.full_name || !walkin.address || !walkin.contact_number)) {
      setError("Walk-in customer name, address, and contact number are required.");
      return;
    }
    startTransition(async () => {
      try {
        await checkoutAction(isStaff ? walkin : undefined);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Checkout failed.");
      }
    });
  }

  return (
    <div className="bg-bg-raised border border-line rounded-2xl p-5 sticky top-20 flex flex-col gap-4">
      <h2 className="font-display font-semibold text-lg">Summary</h2>

      {isStaff && (
        <div className="flex flex-col gap-2 border-b border-line pb-4">
          <p className="text-xs uppercase tracking-wide text-ink-faint">Walk-in customer</p>
          <input
            placeholder="Full name *"
            value={walkin.full_name}
            onChange={(e) => setWalkin({ ...walkin, full_name: e.target.value })}
            className="rounded-md border border-line px-2.5 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            placeholder="Address *"
            value={walkin.address}
            onChange={(e) => setWalkin({ ...walkin, address: e.target.value })}
            className="rounded-md border border-line px-2.5 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            placeholder="Contact number *"
            value={walkin.contact_number}
            onChange={(e) => setWalkin({ ...walkin, contact_number: e.target.value })}
            className="rounded-md border border-line px-2.5 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            placeholder="Email (optional)"
            value={walkin.email}
            onChange={(e) => setWalkin({ ...walkin, email: e.target.value })}
            className="rounded-md border border-line px-2.5 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-soft">Total inventory</span>
        <span className="font-data font-semibold">{peso(subtotal)}</span>
      </div>

      {error && <p className="text-sm text-critical">{error}</p>}

      <button
        onClick={submit}
        disabled={pending}
        className="rounded-lg bg-accent text-white font-semibold py-2.5 hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Placing order…" : "Create Order"}
      </button>
      <p className="text-xs text-ink-faint">
        Your order will be sent for manager approval before payment.
      </p>
    </div>
  );
}
