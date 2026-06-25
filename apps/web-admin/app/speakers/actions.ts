"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  SpeakerValidationError,
  slugifySpeaker,
  type SpeakerValidationReason,
} from "@gdggye/backend-core";

import { requireStaff } from "@/lib/server/auth";
import { uploadSpeakerPhoto } from "@/lib/server/speaker-photos";
import {
  createSpeaker,
  getSpeaker,
  updateSpeaker,
} from "@/lib/server/speakers";

export interface SpeakerActionState {
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

function readFile(form: FormData, key: string): File | null {
  const v = form.get(key);
  if (!(v instanceof File)) return null;
  if (v.size === 0) return null;
  return v;
}

const VALIDATION_MESSAGES: Record<SpeakerValidationReason, string> = {
  blank_name: "Name is required.",
  invalid_slug: "Slug must be lowercase letters, numbers, and dashes.",
  slug_taken: "Slug already in use.",
};

function mapError(e: unknown): SpeakerActionState {
  if (e instanceof SpeakerValidationError) {
    const msg = VALIDATION_MESSAGES[e.reason];
    const field = e.reason === "blank_name" ? "name" : "slug";
    return { ok: false, fieldErrors: { [field]: msg } };
  }
  return { ok: false, error: e instanceof Error ? e.message : String(e) };
}

export async function createSpeakerAction(
  _prev: SpeakerActionState,
  form: FormData,
): Promise<SpeakerActionState> {
  await requireStaff();
  const name = readString(form, "name");
  const slug = readString(form, "slug") || slugifySpeaker(name);

  let created;
  try {
    created = await createSpeaker({
      slug,
      name,
      roleEs: readOptional(form, "roleEs"),
      roleEn: readOptional(form, "roleEn"),
      city: readOptional(form, "city"),
      bioEs: readOptional(form, "bioEs"),
      bioEn: readOptional(form, "bioEn"),
      websiteUrl: readOptional(form, "websiteUrl"),
      githubUrl: readOptional(form, "githubUrl"),
      xUrl: readOptional(form, "xUrl"),
      linkedinUrl: readOptional(form, "linkedinUrl"),
    });
  } catch (e) {
    return mapError(e);
  }

  // Optional photo on create. Uploaded after the row exists so the file
  // path can include the new speaker id.
  const photo = readFile(form, "photo");
  if (photo) {
    try {
      const { publicUrl } = await uploadSpeakerPhoto(created.id, photo);
      await updateSpeaker(created.id, { photoUrl: publicUrl });
    } catch (e) {
      // Speaker exists; surface the photo failure but don't roll back the row.
      return mapError(e);
    }
  }

  revalidatePath(`/speakers`);
  redirect(`/speakers/${created.id}/edit`);
}

export async function updateSpeakerAction(
  _prev: SpeakerActionState,
  form: FormData,
): Promise<SpeakerActionState> {
  await requireStaff();
  const id = readString(form, "id");

  try {
    await updateSpeaker(id, {
      slug: readString(form, "slug"),
      name: readString(form, "name"),
      roleEs: readOptional(form, "roleEs"),
      roleEn: readOptional(form, "roleEn"),
      city: readOptional(form, "city"),
      bioEs: readOptional(form, "bioEs"),
      bioEn: readOptional(form, "bioEn"),
      websiteUrl: readOptional(form, "websiteUrl"),
      githubUrl: readOptional(form, "githubUrl"),
      xUrl: readOptional(form, "xUrl"),
      linkedinUrl: readOptional(form, "linkedinUrl"),
    });
  } catch (e) {
    return mapError(e);
  }

  const photo = readFile(form, "photo");
  if (photo) {
    try {
      const { publicUrl } = await uploadSpeakerPhoto(id, photo);
      await updateSpeaker(id, { photoUrl: publicUrl });
    } catch (e) {
      return mapError(e);
    }
  }

  revalidatePath(`/speakers`);
  revalidatePath(`/speakers/${id}/edit`);
  return { ok: true };
}

export async function clearSpeakerPhotoAction(
  _prev: SpeakerActionState,
  form: FormData,
): Promise<SpeakerActionState> {
  await requireStaff();
  const id = readString(form, "id");
  if (!id) return { ok: false, error: "Missing speaker id." };
  // Sanity check it exists.
  const existing = await getSpeaker(id);
  if (!existing) return { ok: false, error: "Speaker not found." };
  try {
    await updateSpeaker(id, { photoUrl: null });
  } catch (e) {
    return mapError(e);
  }
  revalidatePath(`/speakers/${id}/edit`);
  return { ok: true };
}
