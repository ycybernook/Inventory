"use client";

import { useActionState, useEffect, useRef } from "react";
import { createStaffAction, updateStaffAction, type UserActionState } from "@/app/admin/users/actions";
import type { Profile } from "@/lib/database.types";
import { useToast } from "@/components/toast-provider";

export function StaffForm({ staff }: { staff?: Profile }) {
  const action = staff ? updateStaffAction.bind(null, staff.id) : createStaffAction;
  const [state, formAction, pending] = useActionState<UserActionState, FormData>(action, undefined);
  const showToast = useToast();
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) {
      if (state?.error) {
        showToast(state.error, "error");
      } else {
        showToast(staff ? "Account updated." : "Account created.", "success");
      }
    }
    wasPending.current = pending;
  }, [pending, state, showToast, staff]);

  return (
    <form action={formAction} className="bg-bg-raised border border-line rounded-2xl p-6 flex flex-col gap-4 max-w-lg">
      <Field label="Full name" name="full_name" defaultValue={staff?.full_name} required />
      <Field label="Address" name="address" defaultValue={staff?.address ?? ""} required />
      <Field label="Contact number" name="contact_number" defaultValue={staff?.contact_number} required />
      <Field label="Email (optional)" name="email" type="email" defaultValue={staff?.email ?? ""} />

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Role</span>
        <select
          name="role"
          defaultValue={staff?.role ?? "employee"}
          className="rounded-lg border border-line bg-bg px-3 py-2 outline-none focus:border-accent"
        >
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
          <option value="owner">Owner</option>
        </select>
      </label>

      {!staff && <Field label="Temporary password" name="password" type="password" required />}

      {state?.error && <p className="text-sm text-critical">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent text-white font-semibold py-2.5 hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Saving…" : staff ? "Save changes" : "Create account"}
      </button>
    </form>
  );
}

function Field(props: { label: string; name: string; type?: string; defaultValue?: string; required?: boolean }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{props.label}</span>
      <input
        name={props.name}
        type={props.type ?? "text"}
        defaultValue={props.defaultValue}
        required={props.required}
        className="rounded-lg border border-line bg-bg px-3 py-2 outline-none focus:border-accent"
      />
    </label>
  );
}
