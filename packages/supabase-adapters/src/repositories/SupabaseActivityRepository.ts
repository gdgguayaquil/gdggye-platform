import type { Database } from "@gdggye/types";
import type {
  Activity,
  ActivityRepository,
  CreateActivityInput,
  UpdateActivityInput,
} from "@gdggye/backend-core";

import type { SupabaseServerClient } from "../client/createServerClient";
import type { SupabaseServiceClient } from "../client/createServiceClient";
import type { SupabaseBrowserClient } from "../client/createBrowserClient";
import type { AnySupabaseClient } from "../client/types";

type ActivityRow = Database["public"]["Tables"]["activities"]["Row"];
type ActivityInsert = Database["public"]["Tables"]["activities"]["Insert"];
type ActivityUpdate = Database["public"]["Tables"]["activities"]["Update"];

function rowToActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    sponsorId: row.sponsor_id,
    eventId: row.event_id,
    name: row.name,
    points: row.points,
    startsAt: row.starts_at ? new Date(row.starts_at) : null,
    endsAt: row.ends_at ? new Date(row.ends_at) : null,
    qrRotationSeconds: row.qr_rotation_seconds,
    isActive: row.is_active,
    createdAt: new Date(row.created_at),
  };
}

function createInputToInsert(input: CreateActivityInput): ActivityInsert {
  return {
    sponsor_id: input.sponsorId,
    event_id: input.eventId,
    name: input.name,
    points: input.points,
    starts_at: input.startsAt ? input.startsAt.toISOString() : null,
    ends_at: input.endsAt ? input.endsAt.toISOString() : null,
    qr_rotation_seconds: input.qrRotationSeconds,
    is_active: input.isActive,
  };
}

function updateInputToPatch(patch: UpdateActivityInput): ActivityUpdate {
  const out: ActivityUpdate = {};
  if (patch.name !== undefined) out.name = patch.name;
  if (patch.points !== undefined) out.points = patch.points;
  if (patch.startsAt !== undefined) {
    out.starts_at = patch.startsAt ? patch.startsAt.toISOString() : null;
  }
  if (patch.endsAt !== undefined) {
    out.ends_at = patch.endsAt ? patch.endsAt.toISOString() : null;
  }
  if (patch.qrRotationSeconds !== undefined) {
    out.qr_rotation_seconds = patch.qrRotationSeconds;
  }
  if (patch.isActive !== undefined) out.is_active = patch.isActive;
  return out;
}

export class SupabaseActivityRepository implements ActivityRepository {
  private readonly client: AnySupabaseClient;
  constructor(
    client:
      | SupabaseServerClient
      | SupabaseServiceClient
      | SupabaseBrowserClient,
  ) {
    this.client = client as AnySupabaseClient;
  }

  async findById(id: string): Promise<Activity | null> {
    const { data, error } = await this.client
      .from("activities")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error)
      throw new Error(`SupabaseActivityRepository.findById: ${error.message}`);
    return data ? rowToActivity(data) : null;
  }

  async listForEvent(eventId: string): Promise<Activity[]> {
    const { data, error } = await this.client
      .from("activities")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });
    if (error)
      throw new Error(
        `SupabaseActivityRepository.listForEvent: ${error.message}`,
      );
    return (data ?? []).map(rowToActivity);
  }

  async listForSponsor(sponsorId: string): Promise<Activity[]> {
    const { data, error } = await this.client
      .from("activities")
      .select("*")
      .eq("sponsor_id", sponsorId)
      .order("created_at", { ascending: true });
    if (error)
      throw new Error(
        `SupabaseActivityRepository.listForSponsor: ${error.message}`,
      );
    return (data ?? []).map(rowToActivity);
  }

  async create(input: CreateActivityInput): Promise<Activity> {
    const { data, error } = await this.client
      .from("activities")
      .insert(createInputToInsert(input))
      .select("*")
      .single();
    if (error)
      throw new Error(`SupabaseActivityRepository.create: ${error.message}`);
    return rowToActivity(data);
  }

  async update(id: string, patch: UpdateActivityInput): Promise<Activity> {
    const { data, error } = await this.client
      .from("activities")
      .update(updateInputToPatch(patch))
      .eq("id", id)
      .select("*")
      .single();
    if (error)
      throw new Error(`SupabaseActivityRepository.update: ${error.message}`);
    return rowToActivity(data);
  }

  async setActive(id: string, isActive: boolean): Promise<Activity> {
    const { data, error } = await this.client
      .from("activities")
      .update({ is_active: isActive })
      .eq("id", id)
      .select("*")
      .single();
    if (error)
      throw new Error(`SupabaseActivityRepository.setActive: ${error.message}`);
    return rowToActivity(data);
  }
}
