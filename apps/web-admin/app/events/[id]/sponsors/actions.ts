"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { SponsorValidationError } from "@gdggye/backend-core";

import { requireStaff } from "@/lib/server/auth";
import {
  createSponsor,
  setSponsorActive,
  updateSponsor,
} from "@/lib/server/sponsors";

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

function readBool(form: FormData, key: string): boolean {
  return form.get(key) === "on";
}

function mapError(e: unknown): SponsorActionState {
  if (e instanceof SponsorValidationError) {
    return { ok: false, fieldErrors: { name: "Required." } };
  }
  return { ok: false, error: e instanceof Error ? e.message : String(e) };
}

export async function createSponsorAction(
  _prev: SponsorActionState,
  form: FormData,
): Promise<SponsorActionState> {
  await requireStaff();
  const eventId = readString(form, "eventId");

  try {
    await createSponsor({
      eventId,
      name: readString(form, "name"),
      tier: readOptional(form, "tier"),
      logoUrl: readOptional(form, "logoUrl"),
      description: readOptional(form, "description"),
      boothLabel: readOptional(form, "boothLabel"),
      isActive: readBool(form, "isActive"),
    });
  } catch (e) {
    return mapError(e);
  }
  revalidatePath(`/events/${eventId}/sponsors`);
  redirect(`/events/${eventId}/sponsors`);
}

export async function updateSponsorAction(
  _prev: SponsorActionState,
  form: FormData,
): Promise<SponsorActionState> {
  await requireStaff();
  const id = readString(form, "id");
  const eventId = readString(form, "eventId");

  try {
    await updateSponsor(id, {
      name: readString(form, "name"),
      tier: readOptional(form, "tier"),
      logoUrl: readOptional(form, "logoUrl"),
      description: readOptional(form, "description"),
      boothLabel: readOptional(form, "boothLabel"),
      isActive: readBool(form, "isActive"),
    });
  } catch (e) {
    return mapError(e);
  }
  revalidatePath(`/events/${eventId}/sponsors`);
  return { ok: true };
}

export async function toggleSponsorActiveAction(
  _prev: SponsorActionState,
  form: FormData,
): Promise<SponsorActionState> {
  await requireStaff();
  const id = readString(form, "id");
  const eventId = readString(form, "eventId");
  const isActive = readString(form, "isActive") === "true";

  try {
    await setSponsorActive(id, isActive);
  } catch (e) {
    return mapError(e);
  }
  revalidatePath(`/events/${eventId}/sponsors`);
  return { ok: true };
}
