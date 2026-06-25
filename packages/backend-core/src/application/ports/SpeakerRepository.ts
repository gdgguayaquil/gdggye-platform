import type { Speaker } from "../../domain/entities/Speaker";

export interface CreateSpeakerInput {
  slug: string;
  name: string;
  roleEs?: string | null;
  roleEn?: string | null;
  city?: string | null;
  bioEs?: string | null;
  bioEn?: string | null;
  photoUrl?: string | null;
  websiteUrl?: string | null;
  githubUrl?: string | null;
  xUrl?: string | null;
  linkedinUrl?: string | null;
}

export interface UpdateSpeakerInput {
  slug?: string;
  name?: string;
  roleEs?: string | null;
  roleEn?: string | null;
  city?: string | null;
  bioEs?: string | null;
  bioEn?: string | null;
  photoUrl?: string | null;
  websiteUrl?: string | null;
  githubUrl?: string | null;
  xUrl?: string | null;
  linkedinUrl?: string | null;
}

export interface SearchSpeakersInput {
  query: string;
  limit?: number;
}

export interface SpeakerRepository {
  findById(id: string): Promise<Speaker | null>;
  findBySlug(slug: string): Promise<Speaker | null>;
  findManyByIds(ids: readonly string[]): Promise<Speaker[]>;
  list(): Promise<Speaker[]>;
  search(input: SearchSpeakersInput): Promise<Speaker[]>;
  create(input: CreateSpeakerInput): Promise<Speaker>;
  update(id: string, patch: UpdateSpeakerInput): Promise<Speaker>;
}
