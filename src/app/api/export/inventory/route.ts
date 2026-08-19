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
  const { data: products } = await supabase
    .from("products")
    .select("sku, name, unit, price, cost, stock_qty, reorder_point, is_active, categories(name)")
    .order("name");

  const header = ["SKU", "Name", "Category", "Unit", "Price", "Cost", "Stock", "Reorder Point", "Active"];
  const rows = (products ?? []).map((p) => [
    p.sku,
    p.name,
    (p.categories as unknown as { name: string } | null)?.name ?? "",
    p.unit,
    p.price,
    p.cost ?? "",
    p.stock_qty,
    p.reorder_point,
    p.is_active ? "yes" : "no",
  ]);

  const csv = [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inventory-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
