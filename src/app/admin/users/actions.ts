"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@/lib/database.types";

export type UserActionState = { error?: string } | undefined;

export async function createStaffAction(_prevState: UserActionState, formData: FormData): Promise<UserActionState> {
  const actor = await requireRole(["owner"]);

  const fullName = String(formData.get("full_name") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const contactNumber = String(formData.get("contact_number") || "").trim();
  const email = String(formData.get("email") || "").trim() || null;
  const role = String(formData.get("role") || "employee") as UserRole;
  const password = String(formData.get("password") || "");

  if (!fullName || !address || !contactNumber) return { error: "Full name, address, and contact number are required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (!["employee", "manager", "owner"].includes(role)) return { error: "Invalid role." };

  const admin = createAdminClient();
  const authEmail = email ?? `staff-${contactNumber.replace(/[^0-9]/g, "")}@no-email.internal`;

  const { error } = await admin.auth.admin.createUser({
    email: authEmail,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      address,
      contact_number: contactNumber,
      role,
      email_opted_out: !email,
      created_by: actor.id,
    },
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/users");
}

export async function updateStaffAction(id: string, _prevState: UserActionState, formData: FormData): Promise<UserActionState> {
  await requireRole(["owner"]);
  const supabase = await createClient();

  const payload = {
    full_name: String(formData.get("full_name") || "").trim(),
    address: String(formData.get("address") || "").trim(),
    contact_number: String(formData.get("contact_number") || "").trim(),
    email: String(formData.get("email") || "").trim() || null,
    role: String(formData.get("role") || "employee") as UserRole,
  };

  if (!payload.full_name || !payload.address || !payload.contact_number) {
    return { error: "Full name, address, and contact number are required." };
  }

  const { error } = await supabase.from("profiles").update(payload).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/users");
}

export async function deactivateStaffAction(id: string, isActive: boolean) {
  await requireRole(["owner"]);
  const supabase = await createClient();
  await supabase.from("profiles").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/admin/users");
}

export async function deleteStaffAction(id: string) {
  await requireRole(["owner"]);
  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(id);
  revalidatePath("/admin/users");
}
