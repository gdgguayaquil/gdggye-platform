import type { Database } from "@gdggye/types";
import type {
  CreateSponsorInput,
  SearchSponsorsInput,
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
    slug: row.slug,
    name: row.name,
    logoUrl: row.logo_url,
    description: row.description,
    websiteUrl: row.website_url,
    defaultTier: row.default_tier,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function createInputToInsert(input: CreateSponsorInput): SponsorInsert {
  return {
    slug: input.slug,
    name: input.name,
    logo_url: input.logoUrl ?? null,
    description: input.description ?? null,
    website_url: input.websiteUrl ?? null,
    default_tier: input.defaultTier ?? null,
  };
}

function updateInputToPatch(patch: UpdateSponsorInput): SponsorUpdate {
  const out: SponsorUpdate = {};
  if (patch.slug !== undefined) out.slug = patch.slug;
  if (patch.name !== undefined) out.name = patch.name;
  if (patch.logoUrl !== undefined) out.logo_url = patch.logoUrl;
  if (patch.description !== undefined) out.description = patch.description;
  if (patch.websiteUrl !== undefined) out.website_url = patch.websiteUrl;
  if (patch.defaultTier !== undefined) out.default_tier = patch.defaultTier;
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

  async findBySlug(slug: string): Promise<Sponsor | null> {
    const { data, error } = await this.client
      .from("sponsors")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error)
      throw new Error(`SupabaseSponsorRepository.findBySlug: ${error.message}`);
    return data ? rowToSponsor(data) : null;
  }

  async list(): Promise<Sponsor[]> {
    const { data, error } = await this.client
      .from("sponsors")
      .select("*")
      .order("name", { ascending: true });
    if (error)
      throw new Error(`SupabaseSponsorRepository.list: ${error.message}`);
    return (data ?? []).map(rowToSponsor);
  }

  async search(input: SearchSponsorsInput): Promise<Sponsor[]> {
    const limit = input.limit ?? 20;
    const trimmed = input.query.trim();
    let query = this.client
      .from("sponsors")
      .select("*")
      .order("name", { ascending: true })
      .limit(limit);
    if (trimmed.length > 0) {
      // Escape PostgREST `or` reserved characters in user input.
      const safe = trimmed.replace(/[,()*]/g, " ");
      query = query.or(`name.ilike.%${safe}%,slug.ilike.%${safe}%`);
    }
    const { data, error } = await query;
    if (error)
      throw new Error(`SupabaseSponsorRepository.search: ${error.message}`);
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
}
