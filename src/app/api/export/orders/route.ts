import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { NextResponse } from "next/server";

function csvEscape(value: unknown): string {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "owner") {
    return NextResponse.json({ error: "Owner access required" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("order_number, source, status, subtotal, discount_amount, total, payment_method, created_at, completed_at")
    .order("created_at", { ascending: false });

  const header = [
    "Order Number",
    "Source",
    "Status",
    "Subtotal",
    "Discount",
    "Total",
    "Payment Method",
    "Created At",
    "Completed At",
  ];
  const rows = (orders ?? []).map((o) => [
    o.order_number,
    o.source,
    o.status,
    o.subtotal,
    o.discount_amount,
    o.total,
    o.payment_method ?? "",
    o.created_at,
    o.completed_at ?? "",
  ]);

  const csv = [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
