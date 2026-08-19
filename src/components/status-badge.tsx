import { ORDER_STATUS_META } from "@/lib/order-status";
import type { OrderStatus } from "@/lib/database.types";

const TONE_CLASSES: Record<string, string> = {
  neutral: "bg-line/60 text-ink-soft",
  warn: "bg-warn-soft text-warn",
  good: "bg-good-soft text-good",
  critical: "bg-critical-soft text-critical",
  accent: "bg-accent-soft text-accent-ink",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const meta = ORDER_STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold font-data ${TONE_CLASSES[meta.tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}
