import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Header } from "@/components/header";
import { CartLines, CheckoutPanel } from "@/components/cart-client";

export default async function CartPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: cart } = await supabase.from("carts").select("id").eq("owner_id", profile.id).maybeSingle();

  const { data: items } = cart
    ? await supabase
        .from("cart_items")
        .select("id, qty, product:products(id, name, sku, unit, price, stock_qty, image_path)")
        .eq("cart_id", cart.id)
    : { data: [] };

  const lines = (items ?? []).map((i: unknown) => i as {
    id: string;
    qty: number;
    product: { id: string; name: string; sku: string; unit: string; price: number; stock_qty: number; image_path: string | null };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.qty * l.product.price, 0);

  return (
    <>
      <Header profile={profile} cartCount={lines.length} />
      <main className="max-w-4xl mx-auto px-6 py-8 flex-1 w-full">
        <h1 className="font-display text-2xl font-semibold mb-6">Your Cart</h1>

        {lines.length === 0 ? (
          <div className="bg-bg-raised border border-line rounded-2xl p-12 text-center text-ink-soft">
            <p className="font-display text-lg text-ink mb-1">Your cart is empty</p>
            <p className="mb-4">Browse the catalog to add items.</p>
            <a href="/catalog" className="inline-block rounded-lg bg-accent text-white font-semibold px-4 py-2 text-sm">
              Go to catalog
            </a>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
            <CartLines lines={lines} />
            <CheckoutPanel subtotal={subtotal} isStaff={profile.role !== "customer"} />
          </div>
        )}
      </main>
    </>
  );
}
