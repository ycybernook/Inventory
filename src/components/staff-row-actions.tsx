"use client";

import { useTransition } from "react";
import { deactivateStaffAction, deleteStaffAction } from "@/app/admin/users/actions";

export function StaffRowActions({ id, isActive }: { id: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => startTransition(() => deactivateStaffAction(id, !isActive))}
        disabled={pending}
        className="text-xs rounded-md border border-line-strong px-2.5 py-1.5 text-ink-soft hover:bg-accent-soft hover:text-ink disabled:opacity-60"
      >
        {isActive ? "Deactivate" : "Activate"}
      </button>
      <button
        onClick={() => {
          if (confirm("Delete this account permanently? This cannot be undone.")) startTransition(() => deleteStaffAction(id));
        }}
        disabled={pending}
        className="text-xs rounded-md bg-critical-soft text-critical px-2.5 py-1.5 hover:bg-critical hover:text-white disabled:opacity-60"
      >
        Delete
      </button>
    </div>
  );
}
