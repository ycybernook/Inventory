export function peso(amount: number): string {
  return "₱" + amount.toLocaleString("en-PH", { maximumFractionDigits: 2 });
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
