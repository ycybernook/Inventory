import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { Header } from "@/components/header";
import { CatalogGrid } from "@/components/catalog-grid";
import type { Product, Category } from "@/lib/database.types";

export default async function CatalogPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const [{ data: products }, { data: categories }, cartCount] = await Promise.all([
    supabase.from("products").select("*").eq("is_active", true).order("name"),
    supabase.from("categories").select("*").order("sort_order"),
    getCartCount(supabase, profile?.id),
  ]);

  return (
    <>
      <Header profile={profile} cartCount={cartCount} />
      <main className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full">
        <CatalogGrid products={(products as Product[]) ?? []} categories={(categories as Category[]) ?? []} canOrder={!!profile} />
      </main>
    </>
  );
}

async function getCartCount(supabase: Awaited<ReturnType<typeof createClient>>, userId?: string) {
  if (!userId) return 0;
  const { data: cart } = await supabase.from("carts").select("id").eq("owner_id", userId).maybeSingle();
  if (!cart) return 0;
  const { count } = await supabase
    .from("cart_items")
    .select("id", { count: "exact", head: true })
    .eq("cart_id", cart.id);
  return count ?? 0;
}
