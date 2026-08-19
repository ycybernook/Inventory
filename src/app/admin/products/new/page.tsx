import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Header } from "@/components/header";
import { ProductForm } from "@/components/product-form";
import type { Category } from "@/lib/database.types";

export default async function NewProductPage() {
  const profile = await requireRole(["manager", "owner"]);
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("*").order("sort_order");

  return (
    <>
      <Header profile={profile} />
      <main className="max-w-3xl mx-auto px-6 py-8 flex-1 w-full">
        <h1 className="font-display text-2xl font-semibold mb-6">New Product</h1>
        <ProductForm categories={(categories as Category[]) ?? []} />
      </main>
    </>
  );
}
