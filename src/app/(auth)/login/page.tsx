"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction } from "@/app/(auth)/actions";
import { AuthCard } from "@/components/auth-card";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/catalog";

  return (
    <AuthCard title="Welcome back" subtitle="Log in to browse the catalog, track orders, and more.">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />
        <Field label="Email or contact number" name="identifier" type="text" autoComplete="username" required />
        <Field label="Password" name="password" type="password" autoComplete="current-password" required />
        {state?.error && <p className="text-sm text-critical">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="mt-1 rounded-lg bg-accent text-white font-semibold py-2.5 hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="text-sm text-ink-soft mt-5 text-center">
        New here?{" "}
        <Link href="/signup" className="text-accent-ink font-semibold">
          Create a customer account
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
      <span className="font-medium">{props.label}</span>
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
