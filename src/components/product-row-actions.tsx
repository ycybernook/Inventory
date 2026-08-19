"use client";

import { useTransition } from "react";
import { deleteProductAction, toggleActiveAction } from "@/app/admin/products/actions";

export function ProductRowActions({
  id,
  isActive,
  canDelete,
}: {
  id: string;
  isActive: boolean;
  canDelete: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => startTransition(() => toggleActiveAction(id, !isActive))}
        disabled={pending}
        className="text-xs rounded-md border border-line-strong px-2.5 py-1.5 text-ink-soft hover:bg-accent-soft hover:text-ink disabled:opacity-60"
      >
        {isActive ? "Deactivate" : "Activate"}
      </button>
      {canDelete && (
        <button
          onClick={() => {
            if (confirm("Delete this product permanently?")) startTransition(() => deleteProductAction(id));
          }}
          disabled={pending}
          className="text-xs rounded-md bg-critical-soft text-critical px-2.5 py-1.5 hover:bg-critical hover:text-white disabled:opacity-60"
        >
          Delete
        </button>
      )}
    </div>
  );
}
