import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Header } from "@/components/header";
import { peso } from "@/lib/format";
import type { Order, Product } from "@/lib/database.types";

export default async function ReportsPage() {
  const profile = await requireRole(["owner"]);
  const supabase = await createClient();

  const [{ data: orders }, { data: products }] = await Promise.all([
    supabase.from("orders").select("*"),
    supabase.from("products").select("*"),
  ]);

  const allOrders = (orders as Order[]) ?? [];
  const allProducts = (products as Product[]) ?? [];
  const completed = allOrders.filter((o) => o.status === "completed");
  const revenue = completed.reduce((sum, o) => sum + o.total, 0);
  const totalDiscounts = allOrders.reduce((sum, o) => sum + o.discount_amount, 0);
  const inventoryValue = allProducts.reduce((sum, p) => sum + p.price * p.stock_qty, 0);
  const activeCount = allOrders.filter((o) => !["completed", "cancelled", "rejected"].includes(o.status)).length;

  return (
    <>
      <Header profile={profile} />
      <main className="max-w-4xl mx-auto px-6 py-8 flex-1 w-full">
        <h1 className="font-display text-2xl font-semibold mb-1">Reports</h1>
        <p className="text-sm text-ink-soft mb-6">Snapshot of orders and inventory, with CSV export.</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <StatTile label="Completed Revenue" value={peso(revenue)} />
          <StatTile label="Discounts Given" value={peso(totalDiscounts)} />
          <StatTile label="Inventory Value" value={peso(inventoryValue)} />
          <StatTile label="Active Orders" value={activeCount.toString()} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-bg-raised border border-line rounded-2xl p-5 flex flex-col gap-2">
            <h2 className="font-display font-semibold text-lg">Orders</h2>
            <p className="text-sm text-ink-soft">
              {allOrders.length} orders total — number, status, subtotal, discount, total, payment method, timestamps.
            </p>
            <a
              href="/api/export/orders"
              className="self-start rounded-lg bg-accent text-white font-semibold px-4 py-2 text-sm hover:opacity-90"
            >
              Export orders CSV
            </a>
          </div>
          <div className="bg-bg-raised border border-line rounded-2xl p-5 flex flex-col gap-2">
            <h2 className="font-display font-semibold text-lg">Inventory</h2>
            <p className="text-sm text-ink-soft">
              {allProducts.length} products — SKU, category, price, cost, stock, reorder point.
            </p>
            <a
              href="/api/export/inventory"
              className="self-start rounded-lg bg-accent text-white font-semibold px-4 py-2 text-sm hover:opacity-90"
            >
              Export inventory CSV
            </a>
          </div>
        </div>
      </main>
    </>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg-raised border border-line rounded-2xl p-4">
      <p className="text-xs uppercase tracking-wide text-ink-faint mb-2">{label}</p>
      <p className="font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}
