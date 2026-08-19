// Customers may skip providing an email at signup. Supabase Auth still
// needs a unique identifier + password, so we derive a synthetic,
// never-delivered address from their contact number. It is never shown to
// the user and never used for messaging — only for auth lookups.
export function syntheticEmail(contactNumber: string): string {
  const digits = contactNumber.replace(/[^0-9]/g, "");
  return `cust-${digits}@no-email.internal`;
}
