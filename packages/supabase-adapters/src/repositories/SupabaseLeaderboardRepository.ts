import type {
  LeaderboardEntry,
  LeaderboardRepository,
  UserRankSummary,
} from "@gdggye/backend-core";

import type { SupabaseServerClient } from "../client/createServerClient";
import type { SupabaseServiceClient } from "../client/createServiceClient";
import type { SupabaseBrowserClient } from "../client/createBrowserClient";
import type { AnySupabaseClient } from "../client/types";

// Leaderboard reads go through the SECURITY DEFINER RPCs from
// migration 0010. The RPCs return only the public-safe fields (id,
// full_name, photo_url, total_points, rank), so they can be granted to
// `anon` without exposing emails or consents on public.users.
//
// The browser client uses this same path for the realtime-tick refetch
// — that's why the constructor accepts any of the three client variants.
export class SupabaseLeaderboardRepository implements LeaderboardRepository {
  private readonly client: AnySupabaseClient;
  constructor(
    client:
      | SupabaseServerClient
      | SupabaseServiceClient
      | SupabaseBrowserClient,
  ) {
    this.client = client as AnySupabaseClient;
  }

  async top(eventId: string, limit: number): Promise<LeaderboardEntry[]> {
    const { data, error } = await this.client.rpc("get_event_leaderboard", {
      p_event_id: eventId,
      p_limit: limit,
    });
    if (error)
      throw new Error(`SupabaseLeaderboardRepository.top: ${error.message}`);
    return (data ?? []).map((row) => ({
      userId: row.user_id,
      fullName: row.full_name,
      photoUrl: row.photo_url,
      totalPoints: row.total_points,
      rank: row.rank,
    }));
  }

  async userRank(
    eventId: string,
    userId: string,
  ): Promise<UserRankSummary | null> {
    const { data, error } = await this.client.rpc("get_user_event_rank", {
      p_event_id: eventId,
      p_user_id: userId,
    });
    if (error)
      throw new Error(
        `SupabaseLeaderboardRepository.userRank: ${error.message}`,
      );
    const row = (data ?? [])[0];
    if (!row) return null;
    return {
      totalPoints: row.total_points,
      rank: row.rank,
    };
  }
}
