import type { Sponsor } from "../../../domain/entities/Sponsor";
import type {
  CreateSponsorInput,
  SearchSponsorsInput,
  SponsorRepository,
  UpdateSponsorInput,
} from "../../ports/SponsorRepository";

export type SponsorValidationReason =
  | "blank_name"
  | "invalid_slug"
  | "slug_taken";

export class SponsorValidationError extends Error {
  constructor(public readonly reason: SponsorValidationReason) {
    super(`Sponsor validation failed: ${reason}`);
    this.name = "SponsorValidationError";
  }
}

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

function validateName(name: string | undefined): void {
  if (name !== undefined && name.trim().length === 0) {
    throw new SponsorValidationError("blank_name");
  }
}

function validateSlug(slug: string | undefined): void {
  if (slug !== undefined && !SLUG_RE.test(slug)) {
    throw new SponsorValidationError("invalid_slug");
  }
}

export interface SponsorDeps {
  sponsorRepo: SponsorRepository;
}

export async function listAllSponsors(deps: SponsorDeps): Promise<Sponsor[]> {
  return deps.sponsorRepo.list();
}

export async function searchSponsors(
  input: SearchSponsorsInput,
  deps: SponsorDeps,
): Promise<Sponsor[]> {
  return deps.sponsorRepo.search({
    query: input.query.trim(),
    limit: input.limit,
  });
}

export async function getSponsor(
  id: string,
  deps: SponsorDeps,
): Promise<Sponsor | null> {
  return deps.sponsorRepo.findById(id);
}

export async function getSponsorBySlug(
  slug: string,
  deps: SponsorDeps,
): Promise<Sponsor | null> {
  return deps.sponsorRepo.findBySlug(slug);
}

export async function createSponsor(
  input: CreateSponsorInput,
  deps: SponsorDeps,
): Promise<Sponsor> {
  validateName(input.name);
  validateSlug(input.slug);
  const existing = await deps.sponsorRepo.findBySlug(input.slug);
  if (existing) throw new SponsorValidationError("slug_taken");
  return deps.sponsorRepo.create(input);
}

export async function updateSponsor(
  id: string,
  patch: UpdateSponsorInput,
  deps: SponsorDeps,
): Promise<Sponsor> {
  validateName(patch.name);
  validateSlug(patch.slug);
  if (patch.slug) {
    const existing = await deps.sponsorRepo.findBySlug(patch.slug);
    if (existing && existing.id !== id) {
      throw new SponsorValidationError("slug_taken");
    }
  }
  return deps.sponsorRepo.update(id, patch);
}

// Helper used by the admin create-on-the-fly modal: build a slug from the
// name. Lowercase alphanumerics + hyphen, trim leading/trailing hyphens.
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
