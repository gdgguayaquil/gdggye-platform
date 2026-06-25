import type { Database } from "@gdggye/types";
import type {
  AttachSpeakerInput,
  EventSpeaker,
  EventSpeakerRepository,
  UpdateEventSpeakerInput,
} from "@gdggye/backend-core";

import type { SupabaseServerClient } from "../client/createServerClient";
import type { SupabaseServiceClient } from "../client/createServiceClient";
import type { SupabaseBrowserClient } from "../client/createBrowserClient";
import type { AnySupabaseClient } from "../client/types";

type EventSpeakerRow = Database["public"]["Tables"]["event_speakers"]["Row"];
type EventSpeakerUpdate =
  Database["public"]["Tables"]["event_speakers"]["Update"];

function rowToEventSpeaker(row: EventSpeakerRow): EventSpeaker {
  return {
    id: row.id,
    eventId: row.event_id,
    speakerId: row.speaker_id,
    displayOrder: row.display_order,
    track: row.track,
    isHeadliner: row.is_headliner,
    isActive: row.is_active,
    createdAt: new Date(row.created_at),
  };
}

function updateInputToPatch(
  patch: UpdateEventSpeakerInput,
): EventSpeakerUpdate {
  const out: EventSpeakerUpdate = {};
  if (patch.displayOrder !== undefined) out.display_order = patch.displayOrder;
  if (patch.track !== undefined) out.track = patch.track;
  if (patch.isHeadliner !== undefined) out.is_headliner = patch.isHeadliner;
  if (patch.isActive !== undefined) out.is_active = patch.isActive;
  return out;
}

export class SupabaseEventSpeakerRepository implements EventSpeakerRepository {
  private readonly client: AnySupabaseClient;
  constructor(
    client:
      | SupabaseServerClient
      | SupabaseServiceClient
      | SupabaseBrowserClient,
  ) {
    this.client = client as AnySupabaseClient;
  }

  async findById(id: string): Promise<EventSpeaker | null> {
    const { data, error } = await this.client
      .from("event_speakers")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error)
      throw new Error(
        `SupabaseEventSpeakerRepository.findById: ${error.message}`,
      );
    return data ? rowToEventSpeaker(data) : null;
  }

  async findByEventAndSpeaker(
    eventId: string,
    speakerId: string,
  ): Promise<EventSpeaker | null> {
    const { data, error } = await this.client
      .from("event_speakers")
      .select("*")
      .eq("event_id", eventId)
      .eq("speaker_id", speakerId)
      .maybeSingle();
    if (error)
      throw new Error(
        `SupabaseEventSpeakerRepository.findByEventAndSpeaker: ${error.message}`,
      );
    return data ? rowToEventSpeaker(data) : null;
  }

  async listForEvent(eventId: string): Promise<EventSpeaker[]> {
    const { data, error } = await this.client
      .from("event_speakers")
      .select("*")
      .eq("event_id", eventId)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error)
      throw new Error(
        `SupabaseEventSpeakerRepository.listForEvent: ${error.message}`,
      );
    return (data ?? []).map(rowToEventSpeaker);
  }

  // Idempotent. (event_id, speaker_id) is unique; 23505 → re-fetch and
  // patch with any supplied overrides (mirrors EventSponsor.attach).
  async attach(input: AttachSpeakerInput): Promise<EventSpeaker> {
    const { data, error } = await this.client
      .from("event_speakers")
      .insert({
        event_id: input.eventId,
        speaker_id: input.speakerId,
        display_order: input.displayOrder ?? 0,
        track: input.track ?? null,
        is_headliner: input.isHeadliner ?? false,
        is_active: input.isActive ?? true,
      })
      .select("*")
      .single();

    if (!error && data) return rowToEventSpeaker(data);

    if (error && error.code === "23505") {
      const existing = await this.findByEventAndSpeaker(
        input.eventId,
        input.speakerId,
      );
      if (existing) {
        const hasOverride =
          input.displayOrder !== undefined ||
          input.track !== undefined ||
          input.isHeadliner !== undefined ||
          input.isActive !== undefined;
        if (!hasOverride) return existing;
        return this.update(existing.id, {
          displayOrder: input.displayOrder,
          track: input.track,
          isHeadliner: input.isHeadliner,
          isActive: input.isActive,
        });
      }
    }
    throw new Error(
      `SupabaseEventSpeakerRepository.attach: ${error?.message ?? "unknown"}`,
    );
  }

  async update(
    id: string,
    patch: UpdateEventSpeakerInput,
  ): Promise<EventSpeaker> {
    const { data, error } = await this.client
      .from("event_speakers")
      .update(updateInputToPatch(patch))
      .eq("id", id)
      .select("*")
      .single();
    if (error)
      throw new Error(
        `SupabaseEventSpeakerRepository.update: ${error.message}`,
      );
    return rowToEventSpeaker(data);
  }

  async detach(id: string): Promise<void> {
    // See SupabaseEventSponsorRepository.detach for the count rationale.
    const { error, count } = await this.client
      .from("event_speakers")
      .delete({ count: "exact" })
      .eq("id", id);
    if (error)
      throw new Error(
        `SupabaseEventSpeakerRepository.detach: ${error.message}`,
      );
    if ((count ?? 0) === 0) {
      throw new Error(
        "SupabaseEventSpeakerRepository.detach: no row affected (already detached, or insufficient permissions).",
      );
    }
  }
}
