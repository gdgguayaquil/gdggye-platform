import type { Database } from "@gdggye/types";
import type {
  CreateSponsorInput,
  Sponsor,
  SponsorRepository,
  UpdateSponsorInput,
} from "@gdggye/backend-core";

import type { SupabaseServerClient } from "../client/createServerClient";
import type { SupabaseServiceClient } from "../client/createServiceClient";
import type { SupabaseBrowserClient } from "../client/createBrowserClient";
import type { AnySupabaseClient } from "../client/types";

type SponsorRow = Database["public"]["Tables"]["sponsors"]["Row"];
type SponsorInsert = Database["public"]["Tables"]["sponsors"]["Insert"];
type SponsorUpdate = Database["public"]["Tables"]["sponsors"]["Update"];

function rowToSponsor(row: SponsorRow): Sponsor {
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    tier: row.tier,
    logoUrl: row.logo_url,
    description: row.description,
    boothLabel: row.booth_label,
    isActive: row.is_active,
    createdAt: new Date(row.created_at),
  };
}

function createInputToInsert(input: CreateSponsorInput): SponsorInsert {
  return {
    event_id: input.eventId,
    name: input.name,
    tier: input.tier ?? null,
    logo_url: input.logoUrl ?? null,
    description: input.description ?? null,
    booth_label: input.boothLabel ?? null,
    is_active: input.isActive,
  };
}

function updateInputToPatch(patch: UpdateSponsorInput): SponsorUpdate {
  const out: SponsorUpdate = {};
  if (patch.name !== undefined) out.name = patch.name;
  if (patch.tier !== undefined) out.tier = patch.tier;
  if (patch.logoUrl !== undefined) out.logo_url = patch.logoUrl;
  if (patch.description !== undefined) out.description = patch.description;
  if (patch.boothLabel !== undefined) out.booth_label = patch.boothLabel;
  if (patch.isActive !== undefined) out.is_active = patch.isActive;
  return out;
}

export class SupabaseSponsorRepository implements SponsorRepository {
  private readonly client: AnySupabaseClient;
  constructor(
    client:
      | SupabaseServerClient
      | SupabaseServiceClient
      | SupabaseBrowserClient,
  ) {
    this.client = client as AnySupabaseClient;
  }

  async findById(id: string): Promise<Sponsor | null> {
    const { data, error } = await this.client
      .from("sponsors")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error)
      throw new Error(`SupabaseSponsorRepository.findById: ${error.message}`);
    return data ? rowToSponsor(data) : null;
  }

  async listForEvent(eventId: string): Promise<Sponsor[]> {
    const { data, error } = await this.client
      .from("sponsors")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });
    if (error)
      throw new Error(
        `SupabaseSponsorRepository.listForEvent: ${error.message}`,
      );
    return (data ?? []).map(rowToSponsor);
  }

  async create(input: CreateSponsorInput): Promise<Sponsor> {
    const { data, error } = await this.client
      .from("sponsors")
      .insert(createInputToInsert(input))
      .select("*")
      .single();
    if (error)
      throw new Error(`SupabaseSponsorRepository.create: ${error.message}`);
    return rowToSponsor(data);
  }

  async update(id: string, patch: UpdateSponsorInput): Promise<Sponsor> {
    const { data, error } = await this.client
      .from("sponsors")
      .update(updateInputToPatch(patch))
      .eq("id", id)
      .select("*")
      .single();
    if (error)
      throw new Error(`SupabaseSponsorRepository.update: ${error.message}`);
    return rowToSponsor(data);
  }

  async setActive(id: string, isActive: boolean): Promise<Sponsor> {
    const { data, error } = await this.client
      .from("sponsors")
      .update({ is_active: isActive })
      .eq("id", id)
      .select("*")
      .single();
    if (error)
      throw new Error(`SupabaseSponsorRepository.setActive: ${error.message}`);
    return rowToSponsor(data);
  }
}
