"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type PaymentActionState = { error?: string; success?: boolean } | undefined;

export async function submitPaymentAction(
  orderId: string,
  _prevState: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const method = String(formData.get("method") || "") as "gcash" | "bank_transfer" | "cod" | "cheque";
  const amount = Number(formData.get("amount") || 0);
  const chequeNumber = String(formData.get("cheque_number") || "") || null;
  const chequeBank = String(formData.get("cheque_bank") || "") || null;
  const chequeDate = String(formData.get("cheque_date") || "") || null;
  const codNotes = String(formData.get("cod_notes") || "") || null;
  const screenshot = formData.get("screenshot") as File | null;

  if (!method) return { error: "Select a payment method." };
  if ((method === "gcash" || method === "bank_transfer") && (!screenshot || screenshot.size === 0)) {
    return { error: "Upload a transaction screenshot." };
  }
  if (method === "cheque" && (!chequeNumber || !chequeBank || !chequeDate)) {
    return { error: "Cheque number, bank, and date are required." };
  }

  let screenshotPath: string | null = null;
  if (screenshot && screenshot.size > 0) {
    const path = `${orderId}/${Date.now()}-${screenshot.name}`;
    const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(path, screenshot);
    if (uploadError) return { error: uploadError.message };
    screenshotPath = path;
  }

  const { error: proofError } = await supabase.from("payment_proofs").insert({
    order_id: orderId,
    method,
    screenshot_path: screenshotPath,
    cheque_number: chequeNumber,
    cheque_bank: chequeBank,
    cheque_date: chequeDate,
    cod_notes: codNotes,
    amount,
    submitted_by: user.id,
  });
  if (proofError) return { error: proofError.message };

  const ackNumber = "ACK-" + Date.now().toString(36).toUpperCase();
  const { error: txError } = await supabase.rpc("transition_order_status", {
    p_order_id: orderId,
    p_new_status: "paid",
    p_note: ackNumber,
  });
  if (txError) return { error: txError.message };

  await supabase.from("orders").update({ payment_method: method }).eq("id", orderId);

  revalidatePath(`/orders/${orderId}`);
  return { success: true };
}

export async function markReceivedAction(orderId: string) {
  const supabase = await createClient();
  await supabase.rpc("transition_order_status", { p_order_id: orderId, p_new_status: "completed" });
  revalidatePath(`/orders/${orderId}`);
}

export type DiscountActionState = { error?: string } | undefined;

export async function applyDiscountAction(
  orderId: string,
  _prevState: DiscountActionState,
  formData: FormData
): Promise<DiscountActionState> {
  const supabase = await createClient();
  const amount = Number(formData.get("discount_amount") || 0);
  const reason = String(formData.get("discount_reason") || "") || null;

  if (Number.isNaN(amount) || amount < 0) return { error: "Enter a valid discount amount." };

  const { error } = await supabase.rpc("apply_order_discount", {
    p_order_id: orderId,
    p_discount_amount: amount,
    p_discount_reason: reason,
  });
  if (error) return { error: error.message };

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/admin/orders");
}
