import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Header } from "@/components/header";
import { ProductForm } from "@/components/product-form";
import type { Category, Product } from "@/lib/database.types";

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const profile = await requireRole(["manager", "owner"]);
  const supabase = await createClient();

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("*").order("sort_order"),
  ]);

  if (!product) notFound();

  return (
    <>
      <Header profile={profile} />
      <main className="max-w-3xl mx-auto px-6 py-8 flex-1 w-full">
        <h1 className="font-display text-2xl font-semibold mb-6">Edit Product</h1>
        <ProductForm product={product as Product} categories={(categories as Category[]) ?? []} />
      </main>
    </>
  );
}
