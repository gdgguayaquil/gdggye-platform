import type { Sponsor } from "../../domain/entities/Sponsor";

export interface CreateSponsorInput {
  slug: string;
  name: string;
  logoUrl?: string | null;
  description?: string | null;
  websiteUrl?: string | null;
  defaultTier?: string | null;
}

export interface UpdateSponsorInput {
  slug?: string;
  name?: string;
  logoUrl?: string | null;
  description?: string | null;
  websiteUrl?: string | null;
  defaultTier?: string | null;
}

export interface SearchSponsorsInput {
  query: string;
  limit?: number;
}

export interface SponsorRepository {
  findById(id: string): Promise<Sponsor | null>;
  findBySlug(slug: string): Promise<Sponsor | null>;
  list(): Promise<Sponsor[]>;
  search(input: SearchSponsorsInput): Promise<Sponsor[]>;
  create(input: CreateSponsorInput): Promise<Sponsor>;
  update(id: string, patch: UpdateSponsorInput): Promise<Sponsor>;
}
