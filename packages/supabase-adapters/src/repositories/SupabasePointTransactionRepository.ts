import type {
  PointBreakdownItem,
  PointSource,
  PointTransactionRepository,
} from "@gdggye/backend-core";

import type { SupabaseServerClient } from "../client/createServerClient";
import type { SupabaseServiceClient } from "../client/createServiceClient";
import type { SupabaseBrowserClient } from "../client/createBrowserClient";
import type { AnySupabaseClient } from "../client/types";

// Per-user breakdown lives behind the existing pt_self_read RLS policy
// (user_id = auth.uid() or is_staff()). Caller passes the user-scoped
// client. Groups + sums in memory because the per-user row count is
// small (a handful per event in the typical case).
export class SupabasePointTransactionRepository implements PointTransactionRepository {
  private readonly client: AnySupabaseClient;
  constructor(
    client:
      | SupabaseServerClient
      | SupabaseServiceClient
      | SupabaseBrowserClient,
  ) {
    this.client = client as AnySupabaseClient;
  }

  async breakdownForUser(
    eventId: string,
    userId: string,
  ): Promise<PointBreakdownItem[]> {
    const { data, error } = await this.client
      .from("point_transactions")
      .select("source_type, points")
      .eq("event_id", eventId)
      .eq("user_id", userId);
    if (error)
      throw new Error(
        `SupabasePointTransactionRepository.breakdownForUser: ${error.message}`,
      );

    const acc = new Map<PointSource, PointBreakdownItem>();
    for (const row of data ?? []) {
      const src = row.source_type as PointSource;
      const cur = acc.get(src) ?? { source: src, total: 0, count: 0 };
      cur.total += row.points;
      cur.count += 1;
      acc.set(src, cur);
    }
    // Stable sort so the my-stats view doesn't reshuffle between renders.
    return [...acc.values()].sort((a, b) => b.total - a.total);
  }
}
