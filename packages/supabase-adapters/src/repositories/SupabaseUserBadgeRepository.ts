import type { UserBadgeRepository } from "@gdggye/backend-core";

import type { SupabaseServerClient } from "../client/createServerClient";
import type { SupabaseServiceClient } from "../client/createServiceClient";
import type { AnySupabaseClient } from "../client/types";

// Awards are server-authorized (rule 4): user_badges has no attendee insert
// policy, so `award` must run under the service-role client (like the scan
// point writes). Reads are covered by user_badges_self_read (self or staff).
export class SupabaseUserBadgeRepository implements UserBadgeRepository {
  private readonly client: AnySupabaseClient;
  constructor(client: SupabaseServiceClient | SupabaseServerClient) {
    this.client = client as AnySupabaseClient;
  }

  async awardedBadgeIds(userId: string, eventId: string): Promise<string[]> {
    const { data, error } = await this.client
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", userId)
      .eq("event_id", eventId);
    if (error)
      throw new Error(
        `SupabaseUserBadgeRepository.awardedBadgeIds: ${error.message}`,
      );
    return (data ?? []).map((r) => r.badge_id);
  }

  async award(
    userId: string,
    eventId: string,
    badgeId: string,
  ): Promise<boolean> {
    const { error } = await this.client.from("user_badges").insert({
      user_id: userId,
      event_id: eventId,
      badge_id: badgeId,
    });
    if (!error) return true;
    // Lost the race / already awarded — the unique(user_id, badge_id) index
    // makes this a clean no-op, not an error the caller should see.
    if (error.code === "23505") return false;
    throw new Error(`SupabaseUserBadgeRepository.award: ${error.message}`);
  }

  async awardCountsForEvent(
    eventId: string,
  ): Promise<{ badgeId: string; count: number }[]> {
    // Fetch this event's award rows (badge_id only) and tally in memory —
    // award volume per event is bounded by attendees × badges. Behind the
    // staff read branch of user_badges_self_read.
    const { data, error } = await this.client
      .from("user_badges")
      .select("badge_id")
      .eq("event_id", eventId);
    if (error)
      throw new Error(
        `SupabaseUserBadgeRepository.awardCountsForEvent: ${error.message}`,
      );
    const byBadge = new Map<string, number>();
    for (const row of data ?? []) {
      byBadge.set(row.badge_id, (byBadge.get(row.badge_id) ?? 0) + 1);
    }
    return [...byBadge.entries()].map(([badgeId, count]) => ({
      badgeId,
      count,
    }));
  }
}
