"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signUpAction } from "@/app/(auth)/actions";
import { AuthCard } from "@/components/auth-card";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signUpAction, undefined);
  const [noEmail, setNoEmail] = useState(false);

  return (
    <AuthCard title="Create your account" subtitle="Sign up to browse the catalog and place orders.">
      <form action={formAction} className="flex flex-col gap-4">
        <Field label="Full name" name="full_name" type="text" autoComplete="name" required />
        <Field label="Contact number" name="contact_number" type="tel" autoComplete="tel" required />

        {!noEmail && (
          <Field label="Email" name="email" type="email" autoComplete="email" required={!noEmail} />
        )}

        <label className="flex items-center gap-2 text-sm text-ink-soft -mt-1">
          <input
            type="checkbox"
            name="no_email"
            checked={noEmail}
            onChange={(e) => setNoEmail(e.target.checked)}
            className="h-4 w-4 rounded border-line-strong accent-[var(--accent)]"
          />
          I don&rsquo;t have an email
        </label>

        <Field label="Password" name="password" type="password" autoComplete="new-password" required />
        <Field label="Confirm password" name="confirm_password" type="password" autoComplete="new-password" required />

        {state?.error && <p className="text-sm text-critical">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-1 rounded-lg bg-accent text-white font-semibold py-2.5 hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Creating account…" : noEmail ? "Create account" : "Create account & send code"}
        </button>
      </form>
      <p className="text-sm text-ink-soft mt-5 text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-accent-ink font-semibold">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}

function Field(props: {
  label: string;
  name: string;
  type: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">
        {props.label}
        {props.required && <span className="text-critical"> *</span>}
      </span>
      <input
        name={props.name}
        type={props.type}
        autoComplete={props.autoComplete}
        required={props.required}
        className="rounded-lg border border-line bg-bg px-3 py-2.5 outline-none focus:border-accent"
      />
    </label>
  );
}
