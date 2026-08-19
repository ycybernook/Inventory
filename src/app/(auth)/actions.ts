"use server";

import { createClient } from "@/lib/supabase/server";
import { syntheticEmail } from "@/lib/auth-email";
import { redirect } from "next/navigation";

export type ActionState = { error?: string } | undefined;

export async function signUpAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const fullName = String(formData.get("full_name") || "").trim();
  const contactNumber = String(formData.get("contact_number") || "").trim();
  const emailInput = String(formData.get("email") || "").trim();
  const skipEmail = formData.get("no_email") === "on";
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirm_password") || "");

  if (!fullName || !contactNumber) return { error: "Full name and contact number are required." };
  if (!skipEmail && !emailInput) return { error: "Enter an email, or check “I don’t have an email.”" };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirmPassword) return { error: "Passwords do not match." };

  const email = skipEmail ? syntheticEmail(contactNumber) : emailInput;
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        contact_number: contactNumber,
        role: "customer",
        email_opted_out: skipEmail,
      },
    },
  });

  if (error) return { error: error.message };

  if (skipEmail) {
    // No inbox to send an OTP to — the DB trigger already auto-confirmed
    // this account, so sign in immediately.
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) return { error: signInError.message };
    redirect("/catalog");
  }

  redirect(`/signup/verify?email=${encodeURIComponent(email)}`);
}

export async function verifySignupOtpAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") || "");
  const token = String(formData.get("token") || "").trim();
  if (!email || !token) return { error: "Enter the 6-digit code sent to your email." };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "signup" });
  if (error) return { error: error.message };

  redirect("/catalog");
}

export async function resendSignupOtpAction(email: string) {
  "use server";
  const supabase = await createClient();
  await supabase.auth.resend({ type: "signup", email });
}

export async function loginAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const identifier = String(formData.get("identifier") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/catalog");

  if (!identifier || !password) return { error: "Enter your email/contact number and password." };

  const email = identifier.includes("@") ? identifier : syntheticEmail(identifier);
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Incorrect credentials. Please try again." };

  redirect(next || "/catalog");
}

export async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
