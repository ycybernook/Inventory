"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function ensureCart(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: existing } = await supabase.from("carts").select("id").eq("owner_id", userId).maybeSingle();
  if (existing) return existing.id as string;
  const { data: created, error } = await supabase.from("carts").insert({ owner_id: userId }).select("id").single();
  if (error) throw error;
  return created.id as string;
}

export async function addToCartAction(productId: string, qty = 1) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/catalog");

  const cartId = await ensureCart(supabase, user.id);
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, qty")
    .eq("cart_id", cartId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    await supabase.from("cart_items").update({ qty: existing.qty + qty }).eq("id", existing.id);
  } else {
    await supabase.from("cart_items").insert({ cart_id: cartId, product_id: productId, qty });
  }

  revalidatePath("/catalog");
  revalidatePath("/cart");
}

export async function updateCartItemAction(itemId: string, qty: number) {
  const supabase = await createClient();
  if (qty <= 0) {
    await supabase.from("cart_items").delete().eq("id", itemId);
  } else {
    await supabase.from("cart_items").update({ qty }).eq("id", itemId);
  }
  revalidatePath("/cart");
}

export async function removeCartItemAction(itemId: string) {
  const supabase = await createClient();
  await supabase.from("cart_items").delete().eq("id", itemId);
  revalidatePath("/cart");
}

export async function checkoutAction(walkin?: {
  full_name: string;
  address: string;
  contact_number: string;
  email?: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("checkout_cart", {
    p_walkin_full_name: walkin?.full_name ?? null,
    p_walkin_address: walkin?.address ?? null,
    p_walkin_contact_number: walkin?.contact_number ?? null,
    p_walkin_email: walkin?.email ?? null,
  });
  if (error) throw error;

  revalidatePath("/cart");
  revalidatePath("/orders");
  redirect(`/orders/${data.id}`);
}
