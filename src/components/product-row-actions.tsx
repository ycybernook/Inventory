"use client";

import { useTransition } from "react";
import { deleteProductAction, toggleActiveAction } from "@/app/admin/products/actions";
import { useToast } from "@/components/toast-provider";

export function ProductRowActions({
  id,
  isActive,
  canDelete,
  name,
}: {
  id: string;
  isActive: boolean;
  canDelete: boolean;
  name: string;
}) {
  const [pending, startTransition] = useTransition();
  const showToast = useToast();

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleActiveAction(id, !isActive);
      if (result.error) {
        showToast(result.error, "error");
      } else {
        showToast(isActive ? `${name} deactivated.` : `${name} activated.`, "success");
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Delete ${name} permanently?`)) return;
    startTransition(async () => {
      const result = await deleteProductAction(id);
      if (result.error) {
        showToast(result.error, "error");
      } else {
        showToast(`${name} deleted.`, "success");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        disabled={pending}
        className="text-xs rounded-md border border-line-strong px-2.5 py-1.5 text-ink-soft hover:bg-accent-soft hover:text-ink disabled:opacity-60"
      >
        {isActive ? "Deactivate" : "Activate"}
      </button>
      {canDelete && (
        <button
          onClick={handleDelete}
          disabled={pending}
          className="text-xs rounded-md bg-critical-soft text-critical px-2.5 py-1.5 hover:bg-critical hover:text-white disabled:opacity-60"
        >
          Delete
        </button>
      )}
    </div>
  );
}
