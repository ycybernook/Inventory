import Link from "next/link";

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-dvh flex items-center justify-center px-4 py-12 bg-bg">
      <div className="w-full max-w-md">
        <Link href="/catalog" className="flex items-center gap-2.5 justify-center mb-8">
          <span className="h-9 w-9 rounded-lg bg-accent grid place-items-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 9L12 4L20 9V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V9Z" stroke="#FBFBF7" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M9 20V13H15V20" stroke="#FBFBF7" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="font-display font-semibold text-lg">JR Hardware</span>
        </Link>
        <div className="bg-bg-raised border border-line rounded-2xl shadow-sm p-8">
          <h1 className="font-display text-2xl font-semibold mb-1">{title}</h1>
          <p className="text-sm text-ink-soft mb-6">{subtitle}</p>
          {children}
        </div>
      </div>
    </main>
  );
}
