"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function clockInAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("timesheets").insert({ employee_id: user.id });
  revalidatePath("/dashboard");
}

export async function clockOutAction(timesheetId: string) {
  const supabase = await createClient();
  await supabase.from("timesheets").update({ clock_out: new Date().toISOString() }).eq("id", timesheetId);
  revalidatePath("/dashboard");
}
