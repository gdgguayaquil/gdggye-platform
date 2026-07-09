import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@gdggye/types";

import { readSupabasePublicEnv } from "./env";

interface ServiceEnv {
  url: string;
  secretKey: string;
}

function readServiceEnv(): ServiceEnv {
  const { url } = readSupabasePublicEnv();
  // Prefer the new secret key (`sb_secret_...`); fall back to the legacy
  // service_role key during the migration. Drop the fallback once every
  // environment uses secret keys.
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secretKey) {
    throw new Error("Missing SUPABASE_SECRET_KEY env var (server-only secret)");
  }
  return { url, secretKey };
}

// Server-only Supabase client backed by the service-role key. Bypasses RLS.
// Use exclusively for paths that must escape the user-scoped policies — e.g.
// scan/point writes (`scan_logs` / `point_transactions` have no insert
// policy for attendees on purpose), or admin-only role mutations.
//
// Never pass the returned client into anything that reads user input without
// also doing application-side authorization (the use-cases in backend-core).
export function createSupabaseServiceClient() {
  const { url, secretKey } = readServiceEnv();
  return createClient<Database>(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export type SupabaseServiceClient = ReturnType<
  typeof createSupabaseServiceClient
>;
