import "server-only";

import { createServerClient as createSsrServerClient } from "@supabase/ssr";
import type { Database } from "@gdggye/types";

import { readSupabasePublicEnv } from "./env";

interface CookieToSet {
  name: string;
  value: string;
  options?: Record<string, unknown>;
}

// Cookies are passed in by the caller (Next.js `cookies()` is async in 15+).
// We accept the resolved store so this package doesn't import next/headers.
export interface CookieAdapter {
  getAll(): { name: string; value: string }[];
  setAll(cookies: CookieToSet[]): void;
}

export function createSupabaseServerClient(cookies: CookieAdapter) {
  const { url, publishableKey } = readSupabasePublicEnv();
  return createSsrServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        // RSC contexts cannot set cookies; we swallow the error so reads still
        // work. Mutations should happen in route handlers or actions where
        // setting cookies is allowed.
        try {
          cookies.setAll(cookiesToSet);
        } catch {
          /* no-op in read-only contexts */
        }
      },
    },
  });
}

export type SupabaseServerClient = ReturnType<
  typeof createSupabaseServerClient
>;
