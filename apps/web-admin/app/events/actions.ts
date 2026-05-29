"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  EventValidationError,
  InvalidStatusTransition,
  type EventStatus,
  type EventType,
  type LanguageMode,
} from "@gdggye/backend-core";

import { requireStaff } from "@/lib/server/auth";
import {
  createEvent,
  publishEvent,
  transitionStatus,
  updateEvent,
} from "@/lib/server/events";

export interface ActionState {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

const EVENT_TYPES = [
  "devfest",
  "build_with_ai",
  "google_io",
  "meetup",
  "tech_talk",
  "conference",
  "workshop",
  "hackathon",
] as const;

const LANG_MODES: LanguageMode[] = ["es", "en", "bilingual"];

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

function readDate(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function mapError(e: unknown): ActionState {
  if (e instanceof EventValidationError) {
    const fe: Record<string, string> = {
      invalid_slug:
        "Slug must be lowercase, hyphen-separated, and start/end with alphanumerics.",
      blank_name: "Name is required.",
      invalid_year: "Year must be between 2017 and 2100.",
      invalid_window: "End date must be after start date.",
    };
    const key =
      e.reason === "invalid_slug"
        ? "slug"
        : e.reason === "blank_name"
          ? "name"
          : e.reason === "invalid_year"
            ? "year"
            : "endAt";
    return { ok: false, fieldErrors: { [key]: fe[e.reason] ?? e.reason } };
  }
  if (e instanceof InvalidStatusTransition) {
    return { ok: false, error: `Cannot move ${e.from} → ${e.to}` };
  }
  return { ok: false, error: e instanceof Error ? e.message : String(e) };
}

export async function createEventAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();

  const slug = readString(form, "slug");
  const name = readString(form, "name");
  const type = readString(form, "type") as EventType;
  const year = Number(readString(form, "year"));
  const startAt = readDate(readString(form, "startAt"));
  const endAt = readDate(readString(form, "endAt"));
  const languageMode = readString(form, "languageMode") as LanguageMode;

  if (!startAt || !endAt) {
    return { ok: false, fieldErrors: { startAt: "Invalid date(s)." } };
  }
  if (!EVENT_TYPES.includes(type)) {
    return { ok: false, fieldErrors: { type: "Pick a type." } };
  }
  if (!LANG_MODES.includes(languageMode)) {
    return {
      ok: false,
      fieldErrors: { languageMode: "Pick a language mode." },
    };
  }

  let created;
  try {
    created = await createEvent({
      slug,
      name,
      type,
      year,
      languageMode,
      startAt,
      endAt,
      timezone: readString(form, "timezone") || undefined,
      venueName: readOptional(form, "venueName"),
      venueAddress: readOptional(form, "venueAddress"),
      ticketUrl: readOptional(form, "ticketUrl"),
      leaderboardEnabled: readBool(form, "leaderboardEnabled"),
      themeKey: readString(form, "themeKey") || undefined,
      summaryEs: readOptional(form, "summaryEs"),
      summaryEn: readOptional(form, "summaryEn"),
      expectedAttendance: readOptional(form, "expectedAttendance"),
    });
  } catch (e) {
    return mapError(e);
  }

  revalidatePath("/events");
  redirect(`/events/${created.id}/edit`);
}

export async function updateEventAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const id = readString(form, "id");
  if (!id) return { ok: false, error: "Missing event id." };

  const type = readString(form, "type") as EventType;
  const languageMode = readString(form, "languageMode") as LanguageMode;
  const startAt = readDate(readString(form, "startAt"));
  const endAt = readDate(readString(form, "endAt"));

  try {
    await updateEvent(id, {
      name: readString(form, "name"),
      type,
      year: Number(readString(form, "year")),
      languageMode,
      ...(startAt ? { startAt } : {}),
      ...(endAt ? { endAt } : {}),
      timezone: readString(form, "timezone") || undefined,
      venueName: readOptional(form, "venueName"),
      venueAddress: readOptional(form, "venueAddress"),
      ticketUrl: readOptional(form, "ticketUrl"),
      leaderboardEnabled: readBool(form, "leaderboardEnabled"),
      themeKey: readString(form, "themeKey") || undefined,
      summaryEs: readOptional(form, "summaryEs"),
      summaryEn: readOptional(form, "summaryEn"),
      expectedAttendance: readOptional(form, "expectedAttendance"),
    });
  } catch (e) {
    return mapError(e);
  }

  revalidatePath("/events");
  revalidatePath(`/events/${id}/edit`);
  return { ok: true };
}

export async function transitionEventAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const id = readString(form, "id");
  const next = readString(form, "next") as EventStatus;
  if (!id || !next) return { ok: false, error: "Missing id or next status." };

  try {
    if (next === "published") {
      await publishEvent(id);
    } else {
      await transitionStatus(id, next);
    }
  } catch (e) {
    return mapError(e);
  }

  revalidatePath("/events");
  revalidatePath(`/events/${id}/edit`);
  return { ok: true };
}
