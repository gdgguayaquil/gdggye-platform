import type { Sponsor } from "../../domain/entities/Sponsor";

export interface CreateSponsorInput {
  eventId: string;
  name: string;
  tier?: string | null;
  logoUrl?: string | null;
  description?: string | null;
  boothLabel?: string | null;
  isActive?: boolean;
}

export interface UpdateSponsorInput {
  name?: string;
  tier?: string | null;
  logoUrl?: string | null;
  description?: string | null;
  boothLabel?: string | null;
  isActive?: boolean;
}

export interface SponsorRepository {
  findById(id: string): Promise<Sponsor | null>;
  listForEvent(eventId: string): Promise<Sponsor[]>;
  create(input: CreateSponsorInput): Promise<Sponsor>;
  update(id: string, patch: UpdateSponsorInput): Promise<Sponsor>;
  setActive(id: string, isActive: boolean): Promise<Sponsor>;
}
