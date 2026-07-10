import type {
  InsertPointTransactionInput,
  PointBreakdownItem,
  PointLedgerEntry,
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

  // Un-aggregated ledger for the admin attendee drawer, newest first.
  // Behind pt_self_read (is_staff branch) — caller passes the staff-scoped
  // server client.
  async listForUser(
    eventId: string,
    userId: string,
  ): Promise<PointLedgerEntry[]> {
    const { data, error } = await this.client
      .from("point_transactions")
      .select(
        "id, event_id, user_id, source_type, source_id, points, note, created_at",
      )
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error)
      throw new Error(
        `SupabasePointTransactionRepository.listForUser: ${error.message}`,
      );
    return (data ?? []).map((row) => ({
      id: row.id,
      eventId: row.event_id,
      userId: row.user_id,
      source: row.source_type as PointSource,
      sourceId: row.source_id,
      points: row.points,
      note: row.note,
      createdAt: new Date(row.created_at),
    }));
  }

  // Appends a transaction. For admin_adjustment this runs under the staff
  // server client, gated by the pt_staff_adjust RLS policy. The
  // apply_point_transaction trigger (SECURITY DEFINER) moves the running
  // total on registrations.
  async insert(input: InsertPointTransactionInput): Promise<{ id: string }> {
    const { data, error } = await this.client
      .from("point_transactions")
      .insert({
        event_id: input.eventId,
        user_id: input.userId,
        source_type: input.sourceType,
        source_id: input.sourceId,
        points: input.points,
        note: input.note,
        actor_user_id: input.actorUserId,
        created_at: input.createdAt.toISOString(),
      })
      .select("id")
      .single();
    if (error)
      throw new Error(
        `SupabasePointTransactionRepository.insert: ${error.message}`,
      );
    return { id: data.id };
  }
}
