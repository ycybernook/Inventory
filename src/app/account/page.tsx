import { requireProfile } from "@/lib/auth";
import { Header } from "@/components/header";
import { UpdateContactForm, UpdatePasswordForm } from "@/components/account-forms";

export default async function AccountPage() {
  const profile = await requireProfile();
  return (
    <>
      <Header profile={profile} />
      <main className="max-w-2xl mx-auto px-6 py-8 flex-1 w-full flex flex-col gap-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Account</h1>
          <p className="text-sm text-ink-soft">{profile.full_name}</p>
        </div>
        <UpdateContactForm currentContact={profile.contact_number} />
        <UpdatePasswordForm />
      </main>
    </>
  );
}
