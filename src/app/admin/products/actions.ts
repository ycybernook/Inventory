"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ProductActionState = { error?: string } | undefined;

export async function saveProductAction(_prevState: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const payload = {
    sku: String(formData.get("sku") || "").trim(),
    name: String(formData.get("name") || "").trim(),
    description: String(formData.get("description") || "") || null,
    category_id: String(formData.get("category_id") || "") || null,
    unit: String(formData.get("unit") || "pc"),
    price: Number(formData.get("price") || 0),
    cost: formData.get("cost") ? Number(formData.get("cost")) : null,
    stock_qty: Number(formData.get("stock_qty") || 0),
    reorder_point: Number(formData.get("reorder_point") || 10),
    image_path: String(formData.get("image_path") || "") || null,
  };

  if (!payload.sku || !payload.name) return { error: "SKU and name are required." };

  if (id) {
    const { error } = await supabase.from("products").update(payload).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("products").insert({ ...payload, created_by: user?.id });
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/products");
  revalidatePath("/catalog");
  revalidatePath("/dashboard");
}

export type SimpleResult = { error?: string };

export async function deleteProductAction(id: string): Promise<SimpleResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/products");
  revalidatePath("/catalog");
  return {};
}

export async function toggleActiveAction(id: string, isActive: boolean): Promise<SimpleResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ is_active: isActive }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/products");
  revalidatePath("/catalog");
  return {};
}
