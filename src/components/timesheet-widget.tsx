"use client";

import { useTransition } from "react";
import { clockInAction, clockOutAction } from "@/app/dashboard/actions";
import { formatDate } from "@/lib/format";

export function TimesheetWidget({ openEntry }: { openEntry: { id: string; clock_in: string } | null }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="bg-bg-raised border border-line rounded-2xl p-5 flex items-center justify-between gap-4">
      <div>
        <h2 className="font-display font-semibold text-lg">Timesheet</h2>
        {openEntry ? (
          <p className="text-sm text-ink-soft">Clocked in at {formatDate(openEntry.clock_in)}</p>
        ) : (
          <p className="text-sm text-ink-soft">You&rsquo;re currently clocked out.</p>
        )}
      </div>
      {openEntry ? (
        <button
          onClick={() => startTransition(() => clockOutAction(openEntry.id))}
          disabled={pending}
          className="rounded-lg bg-critical-soft text-critical font-semibold px-4 py-2 text-sm hover:bg-critical hover:text-white disabled:opacity-60"
        >
          {pending ? "…" : "Clock out"}
        </button>
      ) : (
        <button
          onClick={() => startTransition(() => clockInAction())}
          disabled={pending}
          className="rounded-lg bg-accent text-white font-semibold px-4 py-2 text-sm hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "…" : "Clock in"}
        </button>
      )}
    </div>
  );
}
