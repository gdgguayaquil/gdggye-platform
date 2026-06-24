import type { Database } from "@gdggye/types";
import type {
  AttachSponsorInput,
  EventSponsor,
  EventSponsorRepository,
  UpdateEventSponsorInput,
} from "@gdggye/backend-core";

import type { SupabaseServerClient } from "../client/createServerClient";
import type { SupabaseServiceClient } from "../client/createServiceClient";
import type { SupabaseBrowserClient } from "../client/createBrowserClient";
import type { AnySupabaseClient } from "../client/types";

type EventSponsorRow = Database["public"]["Tables"]["event_sponsors"]["Row"];
type EventSponsorUpdate =
  Database["public"]["Tables"]["event_sponsors"]["Update"];

function rowToEventSponsor(row: EventSponsorRow): EventSponsor {
  return {
    id: row.id,
    eventId: row.event_id,
    sponsorId: row.sponsor_id,
    tier: row.tier,
    boothLabel: row.booth_label,
    isActive: row.is_active,
    createdAt: new Date(row.created_at),
  };
}

function updateInputToPatch(
  patch: UpdateEventSponsorInput,
): EventSponsorUpdate {
  const out: EventSponsorUpdate = {};
  if (patch.tier !== undefined) out.tier = patch.tier;
  if (patch.boothLabel !== undefined) out.booth_label = patch.boothLabel;
  if (patch.isActive !== undefined) out.is_active = patch.isActive;
  return out;
}

export class SupabaseEventSponsorRepository implements EventSponsorRepository {
  private readonly client: AnySupabaseClient;
  constructor(
    client:
      | SupabaseServerClient
      | SupabaseServiceClient
      | SupabaseBrowserClient,
  ) {
    this.client = client as AnySupabaseClient;
  }

  async findById(id: string): Promise<EventSponsor | null> {
    const { data, error } = await this.client
      .from("event_sponsors")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error)
      throw new Error(
        `SupabaseEventSponsorRepository.findById: ${error.message}`,
      );
    return data ? rowToEventSponsor(data) : null;
  }

  async findByEventAndSponsor(
    eventId: string,
    sponsorId: string,
  ): Promise<EventSponsor | null> {
    const { data, error } = await this.client
      .from("event_sponsors")
      .select("*")
      .eq("event_id", eventId)
      .eq("sponsor_id", sponsorId)
      .maybeSingle();
    if (error)
      throw new Error(
        `SupabaseEventSponsorRepository.findByEventAndSponsor: ${error.message}`,
      );
    return data ? rowToEventSponsor(data) : null;
  }

  async listForEvent(eventId: string): Promise<EventSponsor[]> {
    const { data, error } = await this.client
      .from("event_sponsors")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });
    if (error)
      throw new Error(
        `SupabaseEventSponsorRepository.listForEvent: ${error.message}`,
      );
    return (data ?? []).map(rowToEventSponsor);
  }

  // Idempotent. Race-safe via the (event_id, sponsor_id) unique constraint:
  // a duplicate insert errors with 23505, in which case we re-fetch the
  // existing row and apply any tier/booth/active overrides supplied.
  async attach(input: AttachSponsorInput): Promise<EventSponsor> {
    const { data, error } = await this.client
      .from("event_sponsors")
      .insert({
        event_id: input.eventId,
        sponsor_id: input.sponsorId,
        tier: input.tier ?? null,
        booth_label: input.boothLabel ?? null,
        is_active: input.isActive ?? true,
      })
      .select("*")
      .single();

    if (!error && data) return rowToEventSponsor(data);

    if (error && error.code === "23505") {
      const existing = await this.findByEventAndSponsor(
        input.eventId,
        input.sponsorId,
      );
      if (existing) {
        const hasOverride =
          input.tier !== undefined ||
          input.boothLabel !== undefined ||
          input.isActive !== undefined;
        if (!hasOverride) return existing;
        return this.update(existing.id, {
          tier: input.tier,
          boothLabel: input.boothLabel,
          isActive: input.isActive,
        });
      }
    }
    throw new Error(
      `SupabaseEventSponsorRepository.attach: ${error?.message ?? "unknown"}`,
    );
  }

  async update(
    id: string,
    patch: UpdateEventSponsorInput,
  ): Promise<EventSponsor> {
    const { data, error } = await this.client
      .from("event_sponsors")
      .update(updateInputToPatch(patch))
      .eq("id", id)
      .select("*")
      .single();
    if (error)
      throw new Error(
        `SupabaseEventSponsorRepository.update: ${error.message}`,
      );
    return rowToEventSponsor(data);
  }

  async detach(id: string): Promise<void> {
    const { error } = await this.client
      .from("event_sponsors")
      .delete()
      .eq("id", id);
    if (error)
      throw new Error(
        `SupabaseEventSponsorRepository.detach: ${error.message}`,
      );
  }
}
