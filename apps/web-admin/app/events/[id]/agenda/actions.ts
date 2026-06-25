"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  AgendaValidationError,
  type AgendaValidationReason,
} from "@gdggye/backend-core";

import {
  createAgendaSlot,
  deleteAgendaSlot,
  setAgendaSlotSpeakers,
  updateAgendaSlot,
} from "@/lib/server/agenda";
import { requireStaff } from "@/lib/server/auth";
import { localStringToUtc } from "@/lib/server/event-time";
import { findEventById } from "@/lib/server/events";

export interface AgendaActionState {
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

function readInt(form: FormData, key: string, fallback = 0): number {
  const v = readString(form, key);
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function readSpeakerIds(form: FormData): string[] {
  // Multi-select checkbox group named "speakerIds[]"
  const all = form.getAll("speakerIds");
  return all.filter((v): v is string => typeof v === "string" && v.length > 0);
}

const VALIDATION_MESSAGES: Record<AgendaValidationReason, string> = {
  blank_title: "At least one title (es or en) is required.",
  negative_duration: "Duration must be ≥ 0.",
  invalid_start_at: "Invalid start time.",
};

function mapError(e: unknown): AgendaActionState {
  if (e instanceof AgendaValidationError) {
    const field =
      e.reason === "invalid_start_at"
        ? "startAt"
        : e.reason === "negative_duration"
          ? "durationMinutes"
          : "titleEs";
    return {
      ok: false,
      fieldErrors: { [field]: VALIDATION_MESSAGES[e.reason] },
    };
  }
  return { ok: false, error: e instanceof Error ? e.message : String(e) };
}

export async function createSlotAction(
  _prev: AgendaActionState,
  form: FormData,
): Promise<AgendaActionState> {
  await requireStaff();
  const eventId = readString(form, "eventId");
  const event = await findEventById(eventId);
  if (!event) return { ok: false, error: "Event not found." };

  const startAtRaw = readString(form, "startAtLocal");
  const startAt = localStringToUtc(startAtRaw, event.timezone);
  if (!startAt) {
    return { ok: false, fieldErrors: { startAt: "Pick a valid start time." } };
  }

  let createdId: string;
  try {
    const slot = await createAgendaSlot({
      eventId,
      startAt,
      durationMinutes: readInt(form, "durationMinutes"),
      titleEs: readString(form, "titleEs"),
      titleEn: readString(form, "titleEn"),
      track: readOptional(form, "track"),
      room: readString(form, "room"),
      displayOrder: readInt(form, "displayOrder"),
    });
    createdId = slot.id;
  } catch (e) {
    return mapError(e);
  }

  const speakerIds = readSpeakerIds(form);
  if (speakerIds.length > 0) {
    try {
      await setAgendaSlotSpeakers(
        createdId,
        speakerIds.map((speakerId, i) => ({ speakerId, displayOrder: i })),
      );
    } catch (e) {
      return mapError(e);
    }
  }

  revalidatePath(`/events/${eventId}/agenda`);
  redirect(`/events/${eventId}/agenda`);
}

export async function updateSlotAction(
  _prev: AgendaActionState,
  form: FormData,
): Promise<AgendaActionState> {
  await requireStaff();
  const id = readString(form, "id");
  const eventId = readString(form, "eventId");
  if (!id || !eventId) return { ok: false, error: "Missing ids." };
  const event = await findEventById(eventId);
  if (!event) return { ok: false, error: "Event not found." };

  const startAtRaw = readString(form, "startAtLocal");
  const startAt = localStringToUtc(startAtRaw, event.timezone);
  if (!startAt) {
    return { ok: false, fieldErrors: { startAt: "Pick a valid start time." } };
  }

  try {
    await updateAgendaSlot(id, {
      startAt,
      durationMinutes: readInt(form, "durationMinutes"),
      titleEs: readString(form, "titleEs"),
      titleEn: readString(form, "titleEn"),
      track: readOptional(form, "track"),
      room: readString(form, "room"),
      displayOrder: readInt(form, "displayOrder"),
    });
  } catch (e) {
    return mapError(e);
  }

  const speakerIds = readSpeakerIds(form);
  try {
    await setAgendaSlotSpeakers(
      id,
      speakerIds.map((speakerId, i) => ({ speakerId, displayOrder: i })),
    );
  } catch (e) {
    return mapError(e);
  }

  revalidatePath(`/events/${eventId}/agenda`);
  return { ok: true };
}

export async function deleteSlotAction(
  _prev: AgendaActionState,
  form: FormData,
): Promise<AgendaActionState> {
  await requireStaff();
  const id = readString(form, "id");
  const eventId = readString(form, "eventId");
  if (!id || !eventId) return { ok: false, error: "Missing ids." };

  try {
    await deleteAgendaSlot(id);
  } catch (e) {
    return mapError(e);
  }
  revalidatePath(`/events/${eventId}/agenda`);
  return { ok: true };
}
