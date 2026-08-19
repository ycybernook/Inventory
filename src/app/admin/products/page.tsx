import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Header } from "@/components/header";
import { peso } from "@/lib/format";
import type { Product } from "@/lib/database.types";
import Link from "next/link";
import { ProductRowActions } from "@/components/product-row-actions";

export default async function AdminProductsPage() {
  const profile = await requireRole(["manager", "owner"]);
  const supabase = await createClient();
  const { data: products } = await supabase.from("products").select("*").order("name");
  const canDelete = profile.role === "owner";

  return (
    <>
      <Header profile={profile} />
      <main className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-semibold">Products</h1>
            <p className="text-sm text-ink-soft">Manage the inventory catalog.</p>
          </div>
          <Link href="/admin/products/new" className="rounded-lg bg-accent text-white font-semibold px-4 py-2 text-sm">
            + New product
          </Link>
        </div>

        <div className="bg-bg-raised border border-line rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-faint border-b border-line">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium text-right">Price</th>
                <th className="px-4 py-3 font-medium text-right">Stock</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {((products as Product[]) ?? []).map((p) => (
                <tr key={p.id} className={!p.is_active ? "opacity-50" : ""}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-data text-ink-faint">{p.sku}</td>
                  <td className="px-4 py-3 text-right font-data">{peso(p.price)}</td>
                  <td className={`px-4 py-3 text-right font-data ${p.stock_qty <= p.reorder_point ? "text-warn font-semibold" : ""}`}>
                    {p.stock_qty}
                  </td>
                  <td className="px-4 py-3">
                    <ProductRowActions id={p.id} isActive={p.is_active} canDelete={canDelete} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
