import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/database.types";
import { redirect } from "next/navigation";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profile) ?? null;
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireRole(roles: Profile["role"][]): Promise<Profile> {
  const profile = await requireProfile();
  if (!roles.includes(profile.role)) redirect("/dashboard");
  return profile;
}
