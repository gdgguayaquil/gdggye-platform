import type { Database } from "@gdggye/types";
import type {
  CreateSpeakerInput,
  SearchSpeakersInput,
  Speaker,
  SpeakerRepository,
  UpdateSpeakerInput,
} from "@gdggye/backend-core";

import type { SupabaseServerClient } from "../client/createServerClient";
import type { SupabaseServiceClient } from "../client/createServiceClient";
import type { SupabaseBrowserClient } from "../client/createBrowserClient";
import type { AnySupabaseClient } from "../client/types";

type SpeakerRow = Database["public"]["Tables"]["speakers"]["Row"];
type SpeakerInsert = Database["public"]["Tables"]["speakers"]["Insert"];
type SpeakerUpdate = Database["public"]["Tables"]["speakers"]["Update"];

function rowToSpeaker(row: SpeakerRow): Speaker {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    roleEs: row.role_es,
    roleEn: row.role_en,
    city: row.city,
    bioEs: row.bio_es,
    bioEn: row.bio_en,
    photoUrl: row.photo_url,
    websiteUrl: row.website_url,
    githubUrl: row.github_url,
    xUrl: row.x_url,
    linkedinUrl: row.linkedin_url,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function createInputToInsert(input: CreateSpeakerInput): SpeakerInsert {
  return {
    slug: input.slug,
    name: input.name,
    role_es: input.roleEs ?? null,
    role_en: input.roleEn ?? null,
    city: input.city ?? null,
    bio_es: input.bioEs ?? null,
    bio_en: input.bioEn ?? null,
    photo_url: input.photoUrl ?? null,
    website_url: input.websiteUrl ?? null,
    github_url: input.githubUrl ?? null,
    x_url: input.xUrl ?? null,
    linkedin_url: input.linkedinUrl ?? null,
  };
}

function updateInputToPatch(patch: UpdateSpeakerInput): SpeakerUpdate {
  const out: SpeakerUpdate = {};
  if (patch.slug !== undefined) out.slug = patch.slug;
  if (patch.name !== undefined) out.name = patch.name;
  if (patch.roleEs !== undefined) out.role_es = patch.roleEs;
  if (patch.roleEn !== undefined) out.role_en = patch.roleEn;
  if (patch.city !== undefined) out.city = patch.city;
  if (patch.bioEs !== undefined) out.bio_es = patch.bioEs;
  if (patch.bioEn !== undefined) out.bio_en = patch.bioEn;
  if (patch.photoUrl !== undefined) out.photo_url = patch.photoUrl;
  if (patch.websiteUrl !== undefined) out.website_url = patch.websiteUrl;
  if (patch.githubUrl !== undefined) out.github_url = patch.githubUrl;
  if (patch.xUrl !== undefined) out.x_url = patch.xUrl;
  if (patch.linkedinUrl !== undefined) out.linkedin_url = patch.linkedinUrl;
  return out;
}

export class SupabaseSpeakerRepository implements SpeakerRepository {
  private readonly client: AnySupabaseClient;
  constructor(
    client:
      | SupabaseServerClient
      | SupabaseServiceClient
      | SupabaseBrowserClient,
  ) {
    this.client = client as AnySupabaseClient;
  }

  async findById(id: string): Promise<Speaker | null> {
    const { data, error } = await this.client
      .from("speakers")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error)
      throw new Error(`SupabaseSpeakerRepository.findById: ${error.message}`);
    return data ? rowToSpeaker(data) : null;
  }

  async findBySlug(slug: string): Promise<Speaker | null> {
    const { data, error } = await this.client
      .from("speakers")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error)
      throw new Error(`SupabaseSpeakerRepository.findBySlug: ${error.message}`);
    return data ? rowToSpeaker(data) : null;
  }

  async findManyByIds(ids: readonly string[]): Promise<Speaker[]> {
    if (ids.length === 0) return [];
    const { data, error } = await this.client
      .from("speakers")
      .select("*")
      .in("id", ids as string[]);
    if (error)
      throw new Error(
        `SupabaseSpeakerRepository.findManyByIds: ${error.message}`,
      );
    return (data ?? []).map(rowToSpeaker);
  }

  async list(): Promise<Speaker[]> {
    const { data, error } = await this.client
      .from("speakers")
      .select("*")
      .order("name", { ascending: true });
    if (error)
      throw new Error(`SupabaseSpeakerRepository.list: ${error.message}`);
    return (data ?? []).map(rowToSpeaker);
  }

  async search(input: SearchSpeakersInput): Promise<Speaker[]> {
    const limit = input.limit ?? 20;
    const trimmed = input.query.trim();
    let query = this.client
      .from("speakers")
      .select("*")
      .order("name", { ascending: true })
      .limit(limit);
    if (trimmed.length > 0) {
      const safe = trimmed.replace(/[,()*]/g, " ");
      query = query.or(`name.ilike.%${safe}%,slug.ilike.%${safe}%`);
    }
    const { data, error } = await query;
    if (error)
      throw new Error(`SupabaseSpeakerRepository.search: ${error.message}`);
    return (data ?? []).map(rowToSpeaker);
  }

  async create(input: CreateSpeakerInput): Promise<Speaker> {
    const { data, error } = await this.client
      .from("speakers")
      .insert(createInputToInsert(input))
      .select("*")
      .single();
    if (error)
      throw new Error(`SupabaseSpeakerRepository.create: ${error.message}`);
    return rowToSpeaker(data);
  }

  async update(id: string, patch: UpdateSpeakerInput): Promise<Speaker> {
    const { data, error } = await this.client
      .from("speakers")
      .update(updateInputToPatch(patch))
      .eq("id", id)
      .select("*")
      .single();
    if (error)
      throw new Error(`SupabaseSpeakerRepository.update: ${error.message}`);
    return rowToSpeaker(data);
  }
}
