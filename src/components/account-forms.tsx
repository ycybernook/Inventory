"use client";

import { useActionState } from "react";
import { updateContactAction, updatePasswordAction } from "@/app/account/actions";

export function UpdateContactForm({ currentContact }: { currentContact: string }) {
  const [state, formAction, pending] = useActionState(updateContactAction, undefined);
  return (
    <form action={formAction} className="bg-bg-raised border border-line rounded-2xl p-5 flex flex-col gap-3 max-w-md">
      <h2 className="font-display font-semibold text-lg">Contact number</h2>
      <input
        name="contact_number"
        defaultValue={currentContact}
        required
        className="rounded-lg border border-line bg-bg px-3 py-2.5 outline-none focus:border-accent"
      />
      {state?.error && <p className="text-sm text-critical">{state.error}</p>}
      {state?.success && <p className="text-sm text-good">Updated.</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-accent text-white font-semibold px-4 py-2 text-sm hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState(updatePasswordAction, undefined);
  return (
    <form action={formAction} className="bg-bg-raised border border-line rounded-2xl p-5 flex flex-col gap-3 max-w-md">
      <h2 className="font-display font-semibold text-lg">Password</h2>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">New password</span>
        <input
          name="password"
          type="password"
          required
          className="rounded-lg border border-line bg-bg px-3 py-2.5 outline-none focus:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Confirm new password</span>
        <input
          name="confirm_password"
          type="password"
          required
          className="rounded-lg border border-line bg-bg px-3 py-2.5 outline-none focus:border-accent"
        />
      </label>
      {state?.error && <p className="text-sm text-critical">{state.error}</p>}
      {state?.success && <p className="text-sm text-good">Password updated.</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-accent text-white font-semibold px-4 py-2 text-sm hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}
