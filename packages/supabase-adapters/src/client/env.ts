// Read the public Supabase env vars. These are exposed to the browser, so
// `NEXT_PUBLIC_*` is intentional. The service role key never flows through
// this package — for write paths it must be loaded inside a server-only
// boundary in the consuming app.

export interface SupabasePublicEnv {
  url: string;
  anonKey: string;
}

export function readSupabasePublicEnv(): SupabasePublicEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars",
    );
  }
  return { url, anonKey };
}
