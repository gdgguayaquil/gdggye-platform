import type {
  Badge,
  BadgeCriteriaType,
  BadgeRepository,
} from "@gdggye/backend-core";

import type { SupabaseServerClient } from "../client/createServerClient";
import type { SupabaseServiceClient } from "../client/createServiceClient";
import type { SupabaseBrowserClient } from "../client/createBrowserClient";
import type { AnySupabaseClient } from "../client/types";

// Badge definitions are public-read (badges_public_read), so any client works.
export class SupabaseBadgeRepository implements BadgeRepository {
  private readonly client: AnySupabaseClient;
  constructor(
    client:
      | SupabaseServerClient
      | SupabaseServiceClient
      | SupabaseBrowserClient,
  ) {
    this.client = client as AnySupabaseClient;
  }

  async listActiveForEvent(eventId: string): Promise<Badge[]> {
    const { data, error } = await this.client
      .from("badges")
      .select(
        "id, event_id, key, name, description, icon, criteria_type, threshold, is_active",
      )
      .eq("is_active", true)
      .or(`event_id.eq.${eventId},event_id.is.null`);
    if (error)
      throw new Error(
        `SupabaseBadgeRepository.listActiveForEvent: ${error.message}`,
      );
    return (data ?? []).map((row) => ({
      id: row.id,
      eventId: row.event_id,
      key: row.key,
      name: row.name,
      description: row.description,
      icon: row.icon,
      criteriaType: row.criteria_type as BadgeCriteriaType,
      threshold: row.threshold,
      isActive: row.is_active,
    }));
  }
}
