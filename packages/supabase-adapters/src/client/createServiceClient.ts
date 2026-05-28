import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@gdggye/types";

import { readSupabasePublicEnv } from "./env";

interface ServiceEnv {
  url: string;
  serviceRoleKey: string;
}

function readServiceEnv(): ServiceEnv {
  const { url } = readSupabasePublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY env var (server-only secret)",
    );
  }
  return { url, serviceRoleKey };
}

// Server-only Supabase client backed by the service-role key. Bypasses RLS.
// Use exclusively for paths that must escape the user-scoped policies — e.g.
// scan/point writes (`scan_logs` / `point_transactions` have no insert
// policy for attendees on purpose), or admin-only role mutations.
//
// Never pass the returned client into anything that reads user input without
// also doing application-side authorization (the use-cases in backend-core).
export function createSupabaseServiceClient() {
  const { url, serviceRoleKey } = readServiceEnv();
  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export type SupabaseServiceClient = ReturnType<
  typeof createSupabaseServiceClient
>;
