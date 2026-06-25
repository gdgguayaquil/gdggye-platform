import type { Database } from "@gdggye/types";
import type {
  AgendaSlot,
  AgendaSlotRepository,
  AgendaSlotSpeaker,
  CreateAgendaSlotInput,
  SpeakerAssignment,
  UpdateAgendaSlotInput,
} from "@gdggye/backend-core";

import type { SupabaseServerClient } from "../client/createServerClient";
import type { SupabaseServiceClient } from "../client/createServiceClient";
import type { SupabaseBrowserClient } from "../client/createBrowserClient";
import type { AnySupabaseClient } from "../client/types";

type SlotRow = Database["public"]["Tables"]["agenda_slots"]["Row"];
type SlotInsert = Database["public"]["Tables"]["agenda_slots"]["Insert"];
type SlotUpdate = Database["public"]["Tables"]["agenda_slots"]["Update"];
type LinkRow = Database["public"]["Tables"]["agenda_slot_speakers"]["Row"];

function rowToSlot(row: SlotRow): AgendaSlot {
  return {
    id: row.id,
    eventId: row.event_id,
    startAt: new Date(row.start_at),
    durationMinutes: row.duration_minutes,
    titleEs: row.title_es,
    titleEn: row.title_en,
    track: row.track,
    room: row.room,
    displayOrder: row.display_order,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function rowToLink(row: LinkRow): AgendaSlotSpeaker {
  return {
    id: row.id,
    slotId: row.slot_id,
    speakerId: row.speaker_id,
    displayOrder: row.display_order,
    createdAt: new Date(row.created_at),
  };
}

function createInputToInsert(input: CreateAgendaSlotInput): SlotInsert {
  return {
    event_id: input.eventId,
    start_at: input.startAt.toISOString(),
    duration_minutes: input.durationMinutes,
    title_es: input.titleEs,
    title_en: input.titleEn,
    track: input.track ?? null,
    room: input.room ?? "",
    display_order: input.displayOrder ?? 0,
  };
}

function updateInputToPatch(patch: UpdateAgendaSlotInput): SlotUpdate {
  const out: SlotUpdate = {};
  if (patch.startAt !== undefined) out.start_at = patch.startAt.toISOString();
  if (patch.durationMinutes !== undefined)
    out.duration_minutes = patch.durationMinutes;
  if (patch.titleEs !== undefined) out.title_es = patch.titleEs;
  if (patch.titleEn !== undefined) out.title_en = patch.titleEn;
  if (patch.track !== undefined) out.track = patch.track;
  if (patch.room !== undefined) out.room = patch.room;
  if (patch.displayOrder !== undefined) out.display_order = patch.displayOrder;
  return out;
}

export class SupabaseAgendaSlotRepository implements AgendaSlotRepository {
  private readonly client: AnySupabaseClient;
  constructor(
    client:
      | SupabaseServerClient
      | SupabaseServiceClient
      | SupabaseBrowserClient,
  ) {
    this.client = client as AnySupabaseClient;
  }

  async findById(id: string): Promise<AgendaSlot | null> {
    const { data, error } = await this.client
      .from("agenda_slots")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error)
      throw new Error(
        `SupabaseAgendaSlotRepository.findById: ${error.message}`,
      );
    return data ? rowToSlot(data) : null;
  }

  async listForEvent(eventId: string): Promise<AgendaSlot[]> {
    const { data, error } = await this.client
      .from("agenda_slots")
      .select("*")
      .eq("event_id", eventId)
      .order("start_at", { ascending: true })
      .order("display_order", { ascending: true });
    if (error)
      throw new Error(
        `SupabaseAgendaSlotRepository.listForEvent: ${error.message}`,
      );
    return (data ?? []).map(rowToSlot);
  }

  async create(input: CreateAgendaSlotInput): Promise<AgendaSlot> {
    const { data, error } = await this.client
      .from("agenda_slots")
      .insert(createInputToInsert(input))
      .select("*")
      .single();
    if (error)
      throw new Error(`SupabaseAgendaSlotRepository.create: ${error.message}`);
    return rowToSlot(data);
  }

  async update(id: string, patch: UpdateAgendaSlotInput): Promise<AgendaSlot> {
    const { data, error } = await this.client
      .from("agenda_slots")
      .update(updateInputToPatch(patch))
      .eq("id", id)
      .select("*")
      .single();
    if (error)
      throw new Error(`SupabaseAgendaSlotRepository.update: ${error.message}`);
    return rowToSlot(data);
  }

  async delete(id: string): Promise<void> {
    // Loud-fail on RLS-silent deletes; same rationale as the event_sponsor
    // / event_speaker detach methods.
    const { error, count } = await this.client
      .from("agenda_slots")
      .delete({ count: "exact" })
      .eq("id", id);
    if (error)
      throw new Error(`SupabaseAgendaSlotRepository.delete: ${error.message}`);
    if ((count ?? 0) === 0) {
      throw new Error(
        "SupabaseAgendaSlotRepository.delete: no row affected (already deleted, or insufficient permissions).",
      );
    }
  }

  async listSpeakerLinksForSlot(slotId: string): Promise<AgendaSlotSpeaker[]> {
    const { data, error } = await this.client
      .from("agenda_slot_speakers")
      .select("*")
      .eq("slot_id", slotId)
      .order("display_order", { ascending: true });
    if (error)
      throw new Error(
        `SupabaseAgendaSlotRepository.listSpeakerLinksForSlot: ${error.message}`,
      );
    return (data ?? []).map(rowToLink);
  }

  // One round-trip lookup for every slot speaker of an event, via the
  // foreign-table inner-join filter on agenda_slots.event_id. Beats N
  // separate listSpeakerLinksForSlot calls on the marketing read path.
  async listSpeakerLinksForEvent(
    eventId: string,
  ): Promise<AgendaSlotSpeaker[]> {
    const { data, error } = await this.client
      .from("agenda_slot_speakers")
      .select(
        "id, slot_id, speaker_id, display_order, created_at, agenda_slots!inner(event_id)",
      )
      .eq("agenda_slots.event_id", eventId)
      .order("display_order", { ascending: true });
    if (error)
      throw new Error(
        `SupabaseAgendaSlotRepository.listSpeakerLinksForEvent: ${error.message}`,
      );
    // The embedded relation comes back as an extra field on the row; strip
    // it before mapping.
    return (data ?? []).map((r) =>
      rowToLink({
        id: r.id,
        slot_id: r.slot_id,
        speaker_id: r.speaker_id,
        display_order: r.display_order,
        created_at: r.created_at,
      } as LinkRow),
    );
  }

  // Replace the slot's full speaker set with the provided assignments.
  // Done as delete-then-insert. Not atomic across the two operations, but
  // failure leaves the slot in a recoverable state (empty or partially
  // assigned); the admin can re-submit.
  async setSpeakers(
    slotId: string,
    assignments: readonly SpeakerAssignment[],
  ): Promise<void> {
    const { error: delError } = await this.client
      .from("agenda_slot_speakers")
      .delete()
      .eq("slot_id", slotId);
    if (delError)
      throw new Error(
        `SupabaseAgendaSlotRepository.setSpeakers (delete): ${delError.message}`,
      );

    if (assignments.length === 0) return;

    const { error: insError } = await this.client
      .from("agenda_slot_speakers")
      .insert(
        assignments.map((a) => ({
          slot_id: slotId,
          speaker_id: a.speakerId,
          display_order: a.displayOrder,
        })),
      );
    if (insError)
      throw new Error(
        `SupabaseAgendaSlotRepository.setSpeakers (insert): ${insError.message}`,
      );
  }
}
