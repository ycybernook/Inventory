"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type AccountActionState = { error?: string; success?: boolean } | undefined;

export async function updateContactAction(_prevState: AccountActionState, formData: FormData): Promise<AccountActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const contactNumber = String(formData.get("contact_number") || "").trim();
  if (!contactNumber) return { error: "Contact number is required." };

  const { error } = await supabase.from("profiles").update({ contact_number: contactNumber }).eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/account");
  return { success: true };
}

export async function updatePasswordAction(_prevState: AccountActionState, formData: FormData): Promise<AccountActionState> {
  const supabase = await createClient();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirm_password") || "");

  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirmPassword) return { error: "Passwords do not match." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  return { success: true };
}
