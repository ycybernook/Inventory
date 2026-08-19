import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Header } from "@/components/header";
import { StaffForm } from "@/components/staff-form";
import type { Profile } from "@/lib/database.types";

export default async function EditStaffPage({ params }: PageProps<"/admin/users/[id]">) {
  const { id } = await params;
  const profile = await requireRole(["owner"]);
  const supabase = await createClient();
  const { data: staff } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (!staff) notFound();

  return (
    <>
      <Header profile={profile} />
      <main className="max-w-3xl mx-auto px-6 py-8 flex-1 w-full">
        <h1 className="font-display text-2xl font-semibold mb-6">Edit Staff Account</h1>
        <StaffForm staff={staff as Profile} />
      </main>
    </>
  );
}
