"use client";

import { useTransition } from "react";
import { clockInAction, clockOutAction } from "@/app/dashboard/actions";
import { formatDate } from "@/lib/format";
import { useToast } from "@/components/toast-provider";

export function TimesheetWidget({ openEntry }: { openEntry: { id: string; clock_in: string } | null }) {
  const [pending, startTransition] = useTransition();
  const showToast = useToast();

  function handleClockIn() {
    startTransition(async () => {
      try {
        await clockInAction();
        showToast("Clocked in.", "success");
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Could not clock in.", "error");
      }
    });
  }

  function handleClockOut(id: string) {
    startTransition(async () => {
      try {
        await clockOutAction(id);
        showToast("Clocked out.", "success");
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Could not clock out.", "error");
      }
    });
  }

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
          onClick={() => handleClockOut(openEntry.id)}
          disabled={pending}
          className="rounded-lg bg-critical-soft text-critical font-semibold px-4 py-2 text-sm hover:bg-critical hover:text-white disabled:opacity-60"
        >
          {pending ? "…" : "Clock out"}
        </button>
      ) : (
        <button
          onClick={handleClockIn}
          disabled={pending}
          className="rounded-lg bg-accent text-white font-semibold px-4 py-2 text-sm hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "…" : "Clock in"}
        </button>
      )}
    </div>
  );
}
