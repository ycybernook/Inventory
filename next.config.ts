import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Safe to expose client-side by design (protected by Postgres RLS) —
    // used as a fallback so the app works even before these are set as
    // proper Vercel project env vars. SUPABASE_SERVICE_ROLE_KEY is NOT
    // included here; it must be set as a server-only Vercel env var.
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://foouxkyervlxvvyljzae.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvb3V4a3llcnZseHZ2eWxqemFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMTQ5MDEsImV4cCI6MjEwMjY5MDkwMX0.pSiw9YPfJPU52Z0Lz0i1FuO2MiAmVLo4gkbjY-k2xdA",
  },
};

export default nextConfig;
