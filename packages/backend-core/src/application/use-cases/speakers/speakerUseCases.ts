import type { Speaker } from "../../../domain/entities/Speaker";
import type {
  CreateSpeakerInput,
  SearchSpeakersInput,
  SpeakerRepository,
  UpdateSpeakerInput,
} from "../../ports/SpeakerRepository";

export type SpeakerValidationReason =
  | "blank_name"
  | "invalid_slug"
  | "slug_taken";

export class SpeakerValidationError extends Error {
  constructor(public readonly reason: SpeakerValidationReason) {
    super(`Speaker validation failed: ${reason}`);
    this.name = "SpeakerValidationError";
  }
}

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

function validateName(name: string | undefined): void {
  if (name !== undefined && name.trim().length === 0) {
    throw new SpeakerValidationError("blank_name");
  }
}

function validateSlug(slug: string | undefined): void {
  if (slug !== undefined && !SLUG_RE.test(slug)) {
    throw new SpeakerValidationError("invalid_slug");
  }
}

export interface SpeakerDeps {
  speakerRepo: SpeakerRepository;
}

export async function listAllSpeakers(deps: SpeakerDeps): Promise<Speaker[]> {
  return deps.speakerRepo.list();
}

export async function searchSpeakers(
  input: SearchSpeakersInput,
  deps: SpeakerDeps,
): Promise<Speaker[]> {
  return deps.speakerRepo.search({
    query: input.query.trim(),
    limit: input.limit,
  });
}

export async function getSpeaker(
  id: string,
  deps: SpeakerDeps,
): Promise<Speaker | null> {
  return deps.speakerRepo.findById(id);
}

export async function getSpeakerBySlug(
  slug: string,
  deps: SpeakerDeps,
): Promise<Speaker | null> {
  return deps.speakerRepo.findBySlug(slug);
}

export async function createSpeaker(
  input: CreateSpeakerInput,
  deps: SpeakerDeps,
): Promise<Speaker> {
  validateName(input.name);
  validateSlug(input.slug);
  const existing = await deps.speakerRepo.findBySlug(input.slug);
  if (existing) throw new SpeakerValidationError("slug_taken");
  return deps.speakerRepo.create(input);
}

export async function updateSpeaker(
  id: string,
  patch: UpdateSpeakerInput,
  deps: SpeakerDeps,
): Promise<Speaker> {
  validateName(patch.name);
  validateSlug(patch.slug);
  if (patch.slug) {
    const existing = await deps.speakerRepo.findBySlug(patch.slug);
    if (existing && existing.id !== id) {
      throw new SpeakerValidationError("slug_taken");
    }
  }
  return deps.speakerRepo.update(id, patch);
}

// Used by the admin create-on-the-fly modal. Same shape as sponsors/slugify.
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
