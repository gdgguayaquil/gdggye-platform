// Read the public Supabase env vars. These are exposed to the browser, so
// `NEXT_PUBLIC_*` is intentional. The secret key never flows through this
// package — for write paths it must be loaded inside a server-only boundary
// in the consuming app (see createServiceClient.ts).

export interface SupabasePublicEnv {
  url: string;
  publishableKey: string;
}

export function readSupabasePublicEnv(): SupabasePublicEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Prefer the new publishable key (`sb_publishable_...`); fall back to the
  // legacy anon key so local `supabase start` output keeps working during the
  // migration. Drop the fallback once every environment uses publishable keys.
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !publishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY env vars",
    );
  }
  return { url, publishableKey };
}
