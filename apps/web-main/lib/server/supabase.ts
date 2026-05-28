import "server-only";

import { cookies } from "next/headers";

import {
  createSupabaseServerClient,
  SupabaseEventContentRepository,
  SupabaseEventRepository,
} from "@gdggye/supabase-adapters";

// Build the Supabase server client for the current request, wired to
// Next's cookie store. The supabase-adapters package is intentionally
// next/headers-free so it doesn't pull next into backend-core's graph.
export async function getSupabaseRepos() {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient({
    getAll() {
      return cookieStore
        .getAll()
        .map((c) => ({ name: c.name, value: c.value }));
    },
    setAll(cookiesToSet) {
      for (const { name, value, options } of cookiesToSet) {
        cookieStore.set(name, value, options);
      }
    },
  });

  return {
    supabase,
    eventRepo: new SupabaseEventRepository(supabase),
    contentRepo: new SupabaseEventContentRepository(supabase),
  };
}
