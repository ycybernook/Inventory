import { requireRole } from "@/lib/auth";
import { Header } from "@/components/header";
import { StaffForm } from "@/components/staff-form";

export default async function NewStaffPage() {
  const profile = await requireRole(["owner"]);
  return (
    <>
      <Header profile={profile} />
      <main className="max-w-3xl mx-auto px-6 py-8 flex-1 w-full">
        <h1 className="font-display text-2xl font-semibold mb-6">New Staff Account</h1>
        <StaffForm />
      </main>
    </>
  );
}
