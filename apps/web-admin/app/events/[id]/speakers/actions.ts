"use server";

import { revalidatePath } from "next/cache";

import {
  SpeakerValidationError,
  slugifySpeaker,
  type SpeakerValidationReason,
} from "@gdggye/backend-core";

import { requireStaff } from "@/lib/server/auth";
import {
  attachSpeakerToEvent,
  detachSpeakerFromEvent,
  updateEventSpeaker,
} from "@/lib/server/event-speakers";
import { uploadSpeakerPhoto } from "@/lib/server/speaker-photos";
import { createSpeaker, updateSpeaker } from "@/lib/server/speakers";

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

function readInt(form: FormData, key: string): number {
  const v = readString(form, key);
  if (!v) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function readFile(form: FormData, key: string): File | null {
  const v = form.get(key);
  if (!(v instanceof File)) return null;
  if (v.size === 0) return null;
  return v;
}

const VALIDATION_MESSAGES: Record<SpeakerValidationReason, string> = {
  blank_name: "Name is required.",
  invalid_slug: "Slug must be lowercase letters, numbers, and dashes.",
  slug_taken: "A speaker with that slug already exists.",
};

function mapError(e: unknown): AttachmentActionState {
  if (e instanceof SpeakerValidationError) {
    const field = e.reason === "blank_name" ? "name" : "slug";
    return {
      ok: false,
      fieldErrors: { [field]: VALIDATION_MESSAGES[e.reason] },
    };
  }
  return { ok: false, error: e instanceof Error ? e.message : String(e) };
}

// Attach an existing speaker (by id) to this event with display order /
// track / headliner. Idempotent: re-attaching updates the existing row.
export async function attachAction(
  _prev: AttachmentActionState,
  form: FormData,
): Promise<AttachmentActionState> {
  await requireStaff();
  const eventId = readString(form, "eventId");
  const speakerId = readString(form, "speakerId");
  if (!eventId || !speakerId) {
    return { ok: false, error: "Missing event or speaker." };
  }

  try {
    await attachSpeakerToEvent({
      eventId,
      speakerId,
      displayOrder: readInt(form, "displayOrder"),
      track: readOptional(form, "track"),
      isHeadliner: readBool(form, "isHeadliner"),
      isActive: true,
    });
  } catch (e) {
    return mapError(e);
  }
  revalidatePath(`/events/${eventId}/speakers`);
  return { ok: true };
}

// Create a new global speaker on the fly and attach. Used by the
// "+ New speaker" modal in the manager.
export async function createAndAttachAction(
  _prev: AttachmentActionState,
  form: FormData,
): Promise<AttachmentActionState> {
  await requireStaff();
  const eventId = readString(form, "eventId");
  const name = readString(form, "name");
  const slug = readString(form, "slug") || slugifySpeaker(name);
  const displayOrder = readInt(form, "displayOrder");
  const track = readOptional(form, "track");
  const isHeadliner = readBool(form, "isHeadliner");

  let speakerId: string;
  try {
    const created = await createSpeaker({
      slug,
      name,
      roleEs: readOptional(form, "roleEs"),
      roleEn: readOptional(form, "roleEn"),
      city: readOptional(form, "city"),
    });
    speakerId = created.id;
  } catch (e) {
    return mapError(e);
  }

  const photo = readFile(form, "photo");
  if (photo) {
    try {
      const { publicUrl } = await uploadSpeakerPhoto(speakerId, photo);
      await updateSpeaker(speakerId, { photoUrl: publicUrl });
    } catch (e) {
      return mapError(e);
    }
  }

  try {
    await attachSpeakerToEvent({
      eventId,
      speakerId,
      displayOrder,
      track,
      isHeadliner,
      isActive: true,
    });
  } catch (e) {
    return mapError(e);
  }

  revalidatePath(`/events/${eventId}/speakers`);
  revalidatePath(`/speakers`);
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
    await updateEventSpeaker(id, {
      displayOrder: readInt(form, "displayOrder"),
      track: readOptional(form, "track"),
      isHeadliner: readBool(form, "isHeadliner"),
      isActive: readBool(form, "isActive"),
    });
  } catch (e) {
    return mapError(e);
  }
  revalidatePath(`/events/${eventId}/speakers`);
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
    await detachSpeakerFromEvent(id);
  } catch (e) {
    return mapError(e);
  }
  revalidatePath(`/events/${eventId}/speakers`);
  return { ok: true };
}
