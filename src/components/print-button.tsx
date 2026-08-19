"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-lg bg-accent text-white font-semibold px-4 py-2 text-sm hover:opacity-90"
    >
      Print
    </button>
  );
}
