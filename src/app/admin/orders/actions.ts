"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@/lib/database.types";

export async function transitionOrderAction(orderId: string, newStatus: OrderStatus, note?: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("transition_order_status", {
    p_order_id: orderId,
    p_new_status: newStatus,
    p_note: note ?? null,
  });
  if (error) throw error;
  revalidatePath("/admin/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/dashboard");
}
