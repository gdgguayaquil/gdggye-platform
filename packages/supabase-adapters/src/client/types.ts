// Internal alias used by every repository constructor.
//
// `@supabase/ssr` and `@supabase/supabase-js` return SupabaseClients whose
// generics are computed slightly differently — TypeScript sees them as
// distinct types and bails on `union.from()` overload resolution as well as
// on `.insert(...)` / `.update(...)` shape resolution.
//
// Repositories accept any of {server, service, browser} client and treat
// them as a single canonical SupabaseClient<Database> shape internally.
// At runtime they are the same shape; the cast just smooths the type difference.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@gdggye/types";

export type AnySupabaseClient = SupabaseClient<Database>;
