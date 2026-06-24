"use server";

import { revalidatePath } from "next/cache";

import {
  SponsorValidationError,
  slugify,
  type SponsorValidationReason,
} from "@gdggye/backend-core";

import { requireStaff } from "@/lib/server/auth";
import {
  attachSponsorToEvent,
  detachSponsorFromEvent,
  updateEventSponsor,
} from "@/lib/server/event-sponsors";
import { createSponsor } from "@/lib/server/sponsors";

export interface AttachmentActionState {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

function readString(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function readOptional(form: FormData, key: string): string | null {
  const v = readString(form, key);
  return v.length > 0 ? v : null;
}

function readBool(form: FormData, key: string): boolean {
  return form.get(key) === "on";
}

const VALIDATION_MESSAGES: Record<SponsorValidationReason, string> = {
  blank_name: "Name is required.",
  invalid_slug: "Slug must be lowercase letters, numbers, and dashes.",
  slug_taken: "A sponsor with that slug already exists.",
};

function mapSponsorError(e: unknown): AttachmentActionState {
  if (e instanceof SponsorValidationError) {
    const field = e.reason === "blank_name" ? "name" : "slug";
    return {
      ok: false,
      fieldErrors: { [field]: VALIDATION_MESSAGES[e.reason] },
    };
  }
  return { ok: false, error: e instanceof Error ? e.message : String(e) };
}

// Attach an *existing* sponsor (by id) to this event with a tier/booth.
// Idempotent at the DB layer: re-attaching updates the existing row.
export async function attachAction(
  _prev: AttachmentActionState,
  form: FormData,
): Promise<AttachmentActionState> {
  await requireStaff();
  const eventId = readString(form, "eventId");
  const sponsorId = readString(form, "sponsorId");
  if (!eventId || !sponsorId) {
    return { ok: false, error: "Missing event or sponsor." };
  }

  try {
    await attachSponsorToEvent({
      eventId,
      sponsorId,
      tier: readOptional(form, "tier"),
      boothLabel: readOptional(form, "boothLabel"),
      isActive: true,
    });
  } catch (e) {
    return mapSponsorError(e);
  }
  revalidatePath(`/events/${eventId}/sponsors`);
  return { ok: true };
}

// Create a new global sponsor on the fly and attach it. Used by the
// "+ New sponsor" modal in the manager so organizers don't have to leave
// the event context to onboard a sponsor.
export async function createAndAttachAction(
  _prev: AttachmentActionState,
  form: FormData,
): Promise<AttachmentActionState> {
  await requireStaff();
  const eventId = readString(form, "eventId");
  const name = readString(form, "name");
  const slug = readString(form, "slug") || slugify(name);
  const tier = readOptional(form, "tier");
  const boothLabel = readOptional(form, "boothLabel");

  let sponsorId: string;
  try {
    const created = await createSponsor({
      slug,
      name,
      logoUrl: readOptional(form, "logoUrl"),
      description: readOptional(form, "description"),
      websiteUrl: readOptional(form, "websiteUrl"),
      defaultTier: tier,
    });
    sponsorId = created.id;
  } catch (e) {
    return mapSponsorError(e);
  }

  try {
    await attachSponsorToEvent({
      eventId,
      sponsorId,
      tier,
      boothLabel,
      isActive: true,
    });
  } catch (e) {
    return mapSponsorError(e);
  }

  revalidatePath(`/events/${eventId}/sponsors`);
  revalidatePath(`/sponsors`);
  return { ok: true };
}

export async function updateAttachmentAction(
  _prev: AttachmentActionState,
  form: FormData,
): Promise<AttachmentActionState> {
  await requireStaff();
  const id = readString(form, "id");
  const eventId = readString(form, "eventId");
  if (!id || !eventId) return { ok: false, error: "Missing attachment id." };

  try {
    await updateEventSponsor(id, {
      tier: readOptional(form, "tier"),
      boothLabel: readOptional(form, "boothLabel"),
      isActive: readBool(form, "isActive"),
    });
  } catch (e) {
    return mapSponsorError(e);
  }
  revalidatePath(`/events/${eventId}/sponsors`);
  return { ok: true };
}

export async function detachAction(
  _prev: AttachmentActionState,
  form: FormData,
): Promise<AttachmentActionState> {
  await requireStaff();
  const id = readString(form, "id");
  const eventId = readString(form, "eventId");
  if (!id || !eventId) return { ok: false, error: "Missing attachment id." };

  try {
    await detachSponsorFromEvent(id);
  } catch (e) {
    return mapSponsorError(e);
  }
  revalidatePath(`/events/${eventId}/sponsors`);
  return { ok: true };
}
