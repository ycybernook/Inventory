import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Header } from "@/components/header";
import type { Profile } from "@/lib/database.types";
import Link from "next/link";
import { StaffRowActions } from "@/components/staff-row-actions";

const ROLE_LABEL: Record<Profile["role"], string> = {
  customer: "Customer",
  employee: "Employee",
  manager: "Manager",
  owner: "Owner",
};

export default async function AdminUsersPage() {
  const profile = await requireRole(["manager", "owner"]);
  const supabase = await createClient();

  const { data: staff } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["employee", "manager", "owner"])
    .order("full_name");

  const isOwner = profile.role === "owner";

  return (
    <>
      <Header profile={profile} />
      <main className="max-w-5xl mx-auto px-6 py-8 flex-1 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-semibold">Employees & Users</h1>
            <p className="text-sm text-ink-soft">
              {isOwner ? "Manage staff accounts, roles, and access." : "View staff accounts and login details."}
            </p>
          </div>
          {isOwner && (
            <Link href="/admin/users/new" className="rounded-lg bg-accent text-white font-semibold px-4 py-2 text-sm">
              + New staff account
            </Link>
          )}
        </div>

        <div className="bg-bg-raised border border-line rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-faint border-b border-line">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Email</th>
                {isOwner && <th className="px-4 py-3 font-medium"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {((staff as Profile[]) ?? []).map((s) => (
                <tr key={s.id} className={!s.is_active ? "opacity-50" : ""}>
                  <td className="px-4 py-3 font-medium">
                    {isOwner ? (
                      <Link href={`/admin/users/${s.id}`} className="hover:underline">
                        {s.full_name}
                      </Link>
                    ) : (
                      s.full_name
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{ROLE_LABEL[s.role]}</td>
                  <td className="px-4 py-3 font-data text-ink-faint">{s.contact_number}</td>
                  <td className="px-4 py-3 text-ink-faint">{s.email ?? "—"}</td>
                  {isOwner && (
                    <td className="px-4 py-3">
                      <StaffRowActions id={s.id} isActive={s.is_active} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
