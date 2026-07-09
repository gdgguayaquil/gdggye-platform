import { createBrowserClient as createSsrBrowserClient } from "@supabase/ssr";
import type { Database } from "@gdggye/types";

import { readSupabasePublicEnv } from "./env";

type Client = ReturnType<typeof createSsrBrowserClient<Database>>;

let cached: Client | null = null;

export function createSupabaseBrowserClient(): Client {
  if (cached) return cached;
  const { url, publishableKey } = readSupabasePublicEnv();
  cached = createSsrBrowserClient<Database>(url, publishableKey);
  return cached;
}

export type SupabaseBrowserClient = Client;
