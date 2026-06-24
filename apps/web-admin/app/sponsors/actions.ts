"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  SponsorValidationError,
  slugify,
  type SponsorValidationReason,
} from "@gdggye/backend-core";

import { requireStaff } from "@/lib/server/auth";
import { createSponsor, updateSponsor } from "@/lib/server/sponsors";

export interface SponsorActionState {
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

const VALIDATION_MESSAGES: Record<SponsorValidationReason, string> = {
  blank_name: "Name is required.",
  invalid_slug: "Slug must be lowercase letters, numbers, and dashes.",
  slug_taken: "Slug already in use.",
};

function mapError(e: unknown): SponsorActionState {
  if (e instanceof SponsorValidationError) {
    const msg = VALIDATION_MESSAGES[e.reason];
    const field = e.reason === "blank_name" ? "name" : "slug";
    return { ok: false, fieldErrors: { [field]: msg } };
  }
  return { ok: false, error: e instanceof Error ? e.message : String(e) };
}

export async function createSponsorAction(
  _prev: SponsorActionState,
  form: FormData,
): Promise<SponsorActionState> {
  await requireStaff();
  const name = readString(form, "name");
  const slug = readString(form, "slug") || slugify(name);

  let created;
  try {
    created = await createSponsor({
      slug,
      name,
      logoUrl: readOptional(form, "logoUrl"),
      description: readOptional(form, "description"),
      websiteUrl: readOptional(form, "websiteUrl"),
      defaultTier: readOptional(form, "defaultTier"),
    });
  } catch (e) {
    return mapError(e);
  }
  revalidatePath(`/sponsors`);
  redirect(`/sponsors/${created.id}/edit`);
}

export async function updateSponsorAction(
  _prev: SponsorActionState,
  form: FormData,
): Promise<SponsorActionState> {
  await requireStaff();
  const id = readString(form, "id");

  try {
    await updateSponsor(id, {
      slug: readString(form, "slug"),
      name: readString(form, "name"),
      logoUrl: readOptional(form, "logoUrl"),
      description: readOptional(form, "description"),
      websiteUrl: readOptional(form, "websiteUrl"),
      defaultTier: readOptional(form, "defaultTier"),
    });
  } catch (e) {
    return mapError(e);
  }
  revalidatePath(`/sponsors`);
  revalidatePath(`/sponsors/${id}/edit`);
  return { ok: true };
}
