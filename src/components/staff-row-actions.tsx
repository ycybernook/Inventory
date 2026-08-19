"use client";

import { useTransition } from "react";
import { deactivateStaffAction, deleteStaffAction } from "@/app/admin/users/actions";
import { useToast } from "@/components/toast-provider";

export function StaffRowActions({ id, isActive, fullName }: { id: string; isActive: boolean; fullName: string }) {
  const [pending, startTransition] = useTransition();
  const showToast = useToast();

  function handleDeactivate() {
    startTransition(async () => {
      const result = await deactivateStaffAction(id, !isActive);
      if (result.error) {
        showToast(result.error, "error");
      } else {
        showToast(isActive ? `${fullName} deactivated.` : `${fullName} activated.`, "success");
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Delete ${fullName}'s account permanently? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteStaffAction(id);
      if (result.error) {
        showToast(result.error, "error");
      } else {
        showToast(`${fullName} deleted.`, "success");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleDeactivate}
        disabled={pending}
        className="text-xs rounded-md border border-line-strong px-2.5 py-1.5 text-ink-soft hover:bg-accent-soft hover:text-ink disabled:opacity-60"
      >
        {isActive ? "Deactivate" : "Activate"}
      </button>
      <button
        onClick={handleDelete}
        disabled={pending}
        className="text-xs rounded-md bg-critical-soft text-critical px-2.5 py-1.5 hover:bg-critical hover:text-white disabled:opacity-60"
      >
        Delete
      </button>
    </div>
  );
}
