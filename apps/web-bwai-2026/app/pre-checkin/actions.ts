"use server";

import { revalidatePath } from "next/cache";

import {
  PreCheckinValidationError,
  type PreCheckinValidationReason,
} from "@gdggye/backend-core";

import { requireUser } from "@/lib/server/auth";
import { findEventBySlug } from "@/lib/server/events";
import { submitPreCheckin } from "@/lib/server/pre-checkin";

const EVENT_SLUG = "bwai-2026";

export interface PreCheckinActionState {
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

const VALIDATION_MESSAGES: Record<PreCheckinValidationReason, string> = {
  blank_badge_name: "El nombre para tu badge no puede estar vacío.",
  deadline_passed:
    "La fecha límite del pre-checkin ya pasó. Avísanos en el evento si necesitas ajustes.",
  pre_checkin_disabled: "Este evento no tiene pre-checkin activo.",
  event_not_open: "El evento aún no está abierto para pre-checkin.",
  already_finalized:
    "Tu pre-checkin ya fue revisado. Si necesitas cambios, contacta al staff.",
};

function mapError(e: unknown): PreCheckinActionState {
  if (e instanceof PreCheckinValidationError) {
    const field = e.reason === "blank_badge_name" ? "badgeName" : "_form";
    const msg = VALIDATION_MESSAGES[e.reason];
    return field === "_form"
      ? { ok: false, error: msg }
      : { ok: false, fieldErrors: { [field]: msg } };
  }
  return { ok: false, error: e instanceof Error ? e.message : String(e) };
}

export async function submitPreCheckinAction(
  _prev: PreCheckinActionState,
  form: FormData,
): Promise<PreCheckinActionState> {
  const user = await requireUser("/sign-in?next=/pre-checkin");
  const event = await findEventBySlug(EVENT_SLUG);
  if (!event) return { ok: false, error: "Evento no encontrado." };

  try {
    await submitPreCheckin({
      eventId: event.id,
      userId: user.id,
      badgeName: readString(form, "badgeName"),
      photoConsent: form.get("photoConsent") === "on",
      dietary: readOptional(form, "dietary"),
      tshirtSize: readOptional(form, "tshirtSize"),
      notes: readOptional(form, "notes"),
    });
  } catch (e) {
    return mapError(e);
  }
  revalidatePath("/pre-checkin");
  return { ok: true };
}
