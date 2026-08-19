import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const all = cookieStore.getAll().map((c) => ({ name: c.name, len: c.value.length }));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  return NextResponse.json({
    cookieCount: all.length,
    cookies: all,
    getUserError: error?.message ?? null,
    userId: data?.user?.id ?? null,
  });
}
