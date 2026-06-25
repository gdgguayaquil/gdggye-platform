import type {
  ActivityScanTarget,
  AttendeeScanTarget,
  ScanTargetRepository,
  SponsorScanTarget,
} from "@gdggye/backend-core";

import type { SupabaseServiceClient } from "../client/createServiceClient";
import type { AnySupabaseClient } from "../client/types";

// Resolves QR target ids into scan-eligible domain targets.
//
// - Sponsor scans: a sponsor only counts at an event if it's attached via
//   event_sponsors AND that attachment is active. We use the attachment as
//   the `isActive`/`eventId` source of truth; the QR's `i` field still
//   carries the global sponsor.id (printed once per QR sheet).
//
// - Activity scans: activities live per-event already, so we look up by
//   (event_id, id). The use-case enforces the per-activity time window.
//
// - Attendee scans: out of Phase 2 scope (networking is Phase 5); we
//   return null defensively so any v1 attendee QR can't sneak through.
export class SupabaseScanTargetRepository implements ScanTargetRepository {
  private readonly client: AnySupabaseClient;
  // Service-role required: we deliberately read across event_sponsors +
  // activities in one place. RLS would let an authenticated attendee read
  // event_sponsors anyway (public), but using the service client keeps the
  // scan path uniformly server-authorized.
  constructor(client: SupabaseServiceClient) {
    this.client = client as AnySupabaseClient;
  }

  async find(
    type: "sponsor",
    eventId: string,
    targetId: string,
  ): Promise<SponsorScanTarget | null>;
  async find(
    type: "activity",
    eventId: string,
    targetId: string,
  ): Promise<ActivityScanTarget | null>;
  async find(
    type: "attendee",
    eventId: string,
    targetId: string,
  ): Promise<AttendeeScanTarget | null>;
  async find(
    type: "sponsor" | "activity" | "attendee",
    eventId: string,
    targetId: string,
  ): Promise<
    SponsorScanTarget | ActivityScanTarget | AttendeeScanTarget | null
  > {
    if (type === "sponsor") {
      const { data, error } = await this.client
        .from("event_sponsors")
        .select("id, event_id, sponsor_id, is_active")
        .eq("event_id", eventId)
        .eq("sponsor_id", targetId)
        .maybeSingle();
      if (error)
        throw new Error(
          `SupabaseScanTargetRepository.find(sponsor): ${error.message}`,
        );
      if (!data) return null;
      return {
        type: "sponsor",
        id: data.sponsor_id,
        eventId: data.event_id,
        isActive: data.is_active,
      };
    }

    if (type === "activity") {
      const { data, error } = await this.client
        .from("activities")
        .select("id, event_id, points, starts_at, ends_at, is_active")
        .eq("event_id", eventId)
        .eq("id", targetId)
        .maybeSingle();
      if (error)
        throw new Error(
          `SupabaseScanTargetRepository.find(activity): ${error.message}`,
        );
      if (!data) return null;
      return {
        type: "activity",
        id: data.id,
        eventId: data.event_id,
        points: data.points,
        startsAt: data.starts_at ? new Date(data.starts_at) : null,
        endsAt: data.ends_at ? new Date(data.ends_at) : null,
        isActive: data.is_active,
      };
    }

    // attendee — Phase 5; refuse for now.
    return null;
  }
}
