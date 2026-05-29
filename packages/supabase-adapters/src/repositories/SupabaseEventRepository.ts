import type { Database } from "@gdggye/types";
import type {
  CreateEventInput,
  Event,
  EventRepository,
  EventStatus,
  ListEventsFilter,
  UpdateEventInput,
} from "@gdggye/backend-core";

import type { SupabaseServerClient } from "../client/createServerClient";
import type { SupabaseServiceClient } from "../client/createServiceClient";
import type { SupabaseBrowserClient } from "../client/createBrowserClient";
import type { AnySupabaseClient } from "../client/types";
import { rowToEvent } from "./mappers";

type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
type EventUpdate = Database["public"]["Tables"]["events"]["Update"];

function createInputToInsert(input: CreateEventInput): EventInsert {
  return {
    slug: input.slug,
    name: input.name,
    type: input.type,
    year: input.year,
    language_mode: input.languageMode,
    start_at: input.startAt.toISOString(),
    end_at: input.endAt.toISOString(),
    timezone: input.timezone,
    venue_name: input.venueName ?? null,
    venue_address: input.venueAddress ?? null,
    venue_map_url: input.venueMapUrl ?? null,
    ticket_url: input.ticketUrl ?? null,
    pre_checkin_deadline: input.preCheckinDeadline
      ? input.preCheckinDeadline.toISOString()
      : null,
    leaderboard_enabled: input.leaderboardEnabled,
    theme_key: input.themeKey,
    summary_es: input.summaryEs ?? null,
    summary_en: input.summaryEn ?? null,
    expected_attendance: input.expectedAttendance ?? null,
  };
}

function updateInputToPatch(patch: UpdateEventInput): EventUpdate {
  // Only include the keys the caller set so we don't accidentally null out
  // existing values. Supabase update treats undefined as "leave alone".
  const out: EventUpdate = {};
  if (patch.name !== undefined) out.name = patch.name;
  if (patch.type !== undefined) out.type = patch.type;
  if (patch.year !== undefined) out.year = patch.year;
  if (patch.languageMode !== undefined) out.language_mode = patch.languageMode;
  if (patch.startAt !== undefined) out.start_at = patch.startAt.toISOString();
  if (patch.endAt !== undefined) out.end_at = patch.endAt.toISOString();
  if (patch.timezone !== undefined) out.timezone = patch.timezone;
  if (patch.venueName !== undefined) out.venue_name = patch.venueName;
  if (patch.venueAddress !== undefined) out.venue_address = patch.venueAddress;
  if (patch.venueMapUrl !== undefined) out.venue_map_url = patch.venueMapUrl;
  if (patch.ticketUrl !== undefined) out.ticket_url = patch.ticketUrl;
  if (patch.preCheckinDeadline !== undefined) {
    out.pre_checkin_deadline = patch.preCheckinDeadline
      ? patch.preCheckinDeadline.toISOString()
      : null;
  }
  if (patch.leaderboardEnabled !== undefined) {
    out.leaderboard_enabled = patch.leaderboardEnabled;
  }
  if (patch.themeKey !== undefined) out.theme_key = patch.themeKey;
  if (patch.summaryEs !== undefined) out.summary_es = patch.summaryEs;
  if (patch.summaryEn !== undefined) out.summary_en = patch.summaryEn;
  if (patch.expectedAttendance !== undefined) {
    out.expected_attendance = patch.expectedAttendance;
  }
  return out;
}

export class SupabaseEventRepository implements EventRepository {
  private readonly client: AnySupabaseClient;
  constructor(
    client:
      | SupabaseServerClient
      | SupabaseServiceClient
      | SupabaseBrowserClient,
  ) {
    this.client = client as AnySupabaseClient;
  }

  async findById(id: string): Promise<Event | null> {
    const { data, error } = await this.client
      .from("events")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      throw new Error(`SupabaseEventRepository.findById: ${error.message}`);
    }
    return data ? rowToEvent(data) : null;
  }

  async findBySlug(slug: string): Promise<Event | null> {
    const { data, error } = await this.client
      .from("events")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) {
      throw new Error(`SupabaseEventRepository.findBySlug: ${error.message}`);
    }
    return data ? rowToEvent(data) : null;
  }

  async list(filter?: ListEventsFilter): Promise<Event[]> {
    let query = this.client
      .from("events")
      .select("*")
      .order("start_at", { ascending: true });

    if (filter?.status && filter.status.length > 0) {
      query = query.in("status", filter.status);
    }
    if (filter?.year !== undefined) {
      query = query.eq("year", filter.year);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`SupabaseEventRepository.list: ${error.message}`);
    }
    return (data ?? []).map(rowToEvent);
  }

  async create(input: CreateEventInput): Promise<Event> {
    const { data, error } = await this.client
      .from("events")
      .insert(createInputToInsert(input))
      .select("*")
      .single();
    if (error) {
      throw new Error(`SupabaseEventRepository.create: ${error.message}`);
    }
    return rowToEvent(data);
  }

  async update(id: string, patch: UpdateEventInput): Promise<Event> {
    const { data, error } = await this.client
      .from("events")
      .update(updateInputToPatch(patch))
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      throw new Error(`SupabaseEventRepository.update: ${error.message}`);
    }
    return rowToEvent(data);
  }

  async updateStatus(id: string, status: EventStatus): Promise<Event> {
    const { data, error } = await this.client
      .from("events")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      throw new Error(`SupabaseEventRepository.updateStatus: ${error.message}`);
    }
    return rowToEvent(data);
  }
}
