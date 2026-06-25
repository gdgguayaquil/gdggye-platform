// Browser-safe barrel. Includes everything needed for client components:
// the browser supabase client + the pure repository classes (which accept
// any of the three client variants and have no server-only imports of
// their own).
//
// Importing from "@gdggye/supabase-adapters" in a client component would
// pull in createServerClient / createServiceClient, both of which carry
// `import 'server-only'` — so the bundler would refuse the build. This
// subpath sidesteps that without weakening the server-only barrier.

export {
  createSupabaseBrowserClient,
  type SupabaseBrowserClient,
} from "./client/createBrowserClient";

export { SupabaseLeaderboardRepository } from "./repositories/SupabaseLeaderboardRepository";
export { SupabasePointTransactionRepository } from "./repositories/SupabasePointTransactionRepository";
