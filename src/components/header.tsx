import Link from "next/link";
import type { Profile } from "@/lib/database.types";
import { signOut } from "@/app/(auth)/actions";

const ROLE_LABEL: Record<Profile["role"], string> = {
  customer: "Customer",
  employee: "Employee",
  manager: "Manager",
  owner: "Owner",
};

export function Header({ profile, cartCount = 0 }: { profile: Profile | null; cartCount?: number }) {
  const isStaff = profile && profile.role !== "customer";

  return (
    <header className="border-b border-line bg-bg-raised/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between gap-4 py-3">
        <Link href="/catalog" className="flex items-center gap-3">
          <span className="h-9 w-9 rounded-lg bg-accent grid place-items-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 9L12 4L20 9V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V9Z" stroke="#FBFBF7" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M9 20V13H15V20" stroke="#FBFBF7" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </span>
          <span>
            <span className="block font-display font-semibold text-lg leading-none">JR Hardware</span>
            <span className="block text-[11px] uppercase tracking-wide text-ink-soft mt-0.5">Inventory System</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          <Link href="/catalog" className="px-3 py-2 rounded-md text-ink-soft hover:bg-accent-soft hover:text-ink">
            Catalog
          </Link>
          {profile && (
            <Link href="/orders" className="px-3 py-2 rounded-md text-ink-soft hover:bg-accent-soft hover:text-ink">
              Orders
            </Link>
          )}
          {isStaff && (
            <Link href="/dashboard" className="px-3 py-2 rounded-md text-ink-soft hover:bg-accent-soft hover:text-ink">
              Dashboard
            </Link>
          )}
          {isStaff && (
            <Link href="/admin/orders" className="px-3 py-2 rounded-md text-ink-soft hover:bg-accent-soft hover:text-ink">
              Order Queue
            </Link>
          )}
          {(profile?.role === "manager" || profile?.role === "owner") && (
            <Link href="/admin/products" className="px-3 py-2 rounded-md text-ink-soft hover:bg-accent-soft hover:text-ink">
              Products
            </Link>
          )}
          {profile?.role === "owner" && (
            <Link href="/admin/users" className="px-3 py-2 rounded-md text-ink-soft hover:bg-accent-soft hover:text-ink">
              Users
            </Link>
          )}
          {profile?.role === "owner" && (
            <Link href="/admin/reports" className="px-3 py-2 rounded-md text-ink-soft hover:bg-accent-soft hover:text-ink">
              Reports
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {profile ? (
            <>
              <Link
                href="/cart"
                className="relative flex items-center gap-2 rounded-lg bg-accent text-white px-3 py-2 text-sm font-semibold hover:opacity-90"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 4H5L6.5 15.5C6.6 16.3 7.3 17 8.1 17H18C18.8 17 19.5 16.4 19.6 15.6L21 7H6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9" cy="20.5" r="1.4" fill="currentColor" /><circle cx="18" cy="20.5" r="1.4" fill="currentColor" /></svg>
                Cart
                <span className="font-data bg-black/20 rounded-full px-1.5 text-xs">{cartCount}</span>
              </Link>
              <Link href="/account" className="hidden sm:flex items-center gap-2 rounded-full border border-line bg-bg-raised px-3 py-1.5 text-xs text-ink-soft">
                <span className="h-5 w-5 rounded-full bg-accent-soft text-accent-ink grid place-items-center font-data text-[10px] font-bold">
                  {profile.full_name.slice(0, 2).toUpperCase()}
                </span>
                {ROLE_LABEL[profile.role]}
              </Link>
              <form action={signOut}>
                <button className="text-xs text-ink-soft hover:text-ink px-2 py-2" type="submit">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-ink-soft hover:text-ink px-3 py-2">
                Log in
              </Link>
              <Link href="/signup" className="rounded-lg bg-accent text-white px-3 py-2 text-sm font-semibold hover:opacity-90">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
