"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { verifySignupOtpAction, resendSignupOtpAction } from "@/app/(auth)/actions";
import { AuthCard } from "@/components/auth-card";

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpForm />
    </Suspense>
  );
}

function VerifyOtpForm() {
  const [state, formAction, pending] = useActionState(verifySignupOtpAction, undefined);
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  return (
    <AuthCard title="Check your email" subtitle={`Enter the 6-digit code we sent to ${email}.`}>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="email" value={email} />
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Verification code</span>
          <input
            name="token"
            type="text"
            inputMode="numeric"
            maxLength={6}
            required
            className="rounded-lg border border-line bg-bg px-3 py-2.5 text-center font-data text-lg tracking-[0.4em] outline-none focus:border-accent"
            placeholder="000000"
          />
        </label>
        {state?.error && <p className="text-sm text-critical">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent text-white font-semibold py-2.5 hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Verifying…" : "Verify & continue"}
        </button>
      </form>
      <form action={resendSignupOtpAction.bind(null, email)} className="mt-4 text-center">
        <button type="submit" className="text-sm text-accent-ink font-semibold">
          Resend code
        </button>
      </form>
    </AuthCard>
  );
}
