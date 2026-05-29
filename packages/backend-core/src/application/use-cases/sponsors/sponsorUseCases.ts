import type { Sponsor } from "../../../domain/entities/Sponsor";
import type {
  CreateSponsorInput,
  SponsorRepository,
  UpdateSponsorInput,
} from "../../ports/SponsorRepository";

export type SponsorValidationReason = "blank_name";

export class SponsorValidationError extends Error {
  constructor(public readonly reason: SponsorValidationReason) {
    super(`Sponsor validation failed: ${reason}`);
    this.name = "SponsorValidationError";
  }
}

function validate(name: string | undefined): void {
  if (name !== undefined && name.trim().length === 0) {
    throw new SponsorValidationError("blank_name");
  }
}

export interface SponsorDeps {
  sponsorRepo: SponsorRepository;
}

// G2 — list all sponsors attached to an event (admin view, includes inactive).
export async function listSponsorsForEvent(
  eventId: string,
  deps: SponsorDeps,
): Promise<Sponsor[]> {
  return deps.sponsorRepo.listForEvent(eventId);
}

export async function getSponsor(
  id: string,
  deps: SponsorDeps,
): Promise<Sponsor | null> {
  return deps.sponsorRepo.findById(id);
}

export async function createSponsor(
  input: CreateSponsorInput,
  deps: SponsorDeps,
): Promise<Sponsor> {
  validate(input.name);
  return deps.sponsorRepo.create(input);
}

export async function updateSponsor(
  id: string,
  patch: UpdateSponsorInput,
  deps: SponsorDeps,
): Promise<Sponsor> {
  validate(patch.name);
  return deps.sponsorRepo.update(id, patch);
}

export async function setSponsorActive(
  id: string,
  isActive: boolean,
  deps: SponsorDeps,
): Promise<Sponsor> {
  return deps.sponsorRepo.setActive(id, isActive);
}
