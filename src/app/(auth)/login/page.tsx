"use client";

import { Suspense, useActionState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction } from "@/app/(auth)/actions";
import { AuthCard } from "@/components/auth-card";

const DEMO_ACCOUNTS = [
  { role: "Owner", email: "owner@jrhardware.com" },
  { role: "Manager", email: "manager1@jrhardware.com" },
  { role: "Employee", email: "staff1@jrhardware.com" },
  { role: "Customer", email: "customer1@jrhardware.com" },
];
const DEMO_PASSWORD = "12345678";

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

  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function fillDemo(email: string) {
    if (identifierRef.current) identifierRef.current.value = email;
    if (passwordRef.current) passwordRef.current.value = DEMO_PASSWORD;
  }

  return (
    <AuthCard title="Welcome back" subtitle="Log in to browse the catalog, track orders, and more.">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Email or contact number</span>
          <input
            name="identifier"
            type="text"
            autoComplete="username"
            required
            ref={identifierRef}
            className="rounded-lg border border-line bg-bg px-3 py-2.5 outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            ref={passwordRef}
            className="rounded-lg border border-line bg-bg px-3 py-2.5 outline-none focus:border-accent"
          />
        </label>
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

      <div className="mt-6 rounded-xl border border-line bg-bg px-4 py-3.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint mb-2">Demo Accounts</p>
        <ul className="flex flex-col gap-1.5">
          {DEMO_ACCOUNTS.map((acc) => (
            <li key={acc.email}>
              <button
                type="button"
                onClick={() => fillDemo(acc.email)}
                className="w-full flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent-soft"
              >
                <span className="text-ink-soft">{acc.role}</span>
                <span className="font-data text-xs text-ink">
                  {acc.email} <span className="text-ink-faint">/ {DEMO_PASSWORD}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </AuthCard>
  );
}

