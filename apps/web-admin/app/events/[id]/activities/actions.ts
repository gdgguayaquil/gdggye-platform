"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { ActivityValidationError } from "@gdggye/backend-core";

import { requireStaff } from "@/lib/server/auth";
import {
  createActivity,
  setActivityActive,
  updateActivity,
} from "@/lib/server/activities";

export interface ActivityActionState {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

function readString(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function readBool(form: FormData, key: string): boolean {
  return form.get(key) === "on";
}

function readDate(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function mapError(e: unknown): ActivityActionState {
  if (e instanceof ActivityValidationError) {
    const labels: Record<string, string> = {
      blank_name: "Required.",
      negative_points: "Points must be ≥ 0.",
      invalid_window: "End must be after start.",
    };
    const key =
      e.reason === "blank_name"
        ? "name"
        : e.reason === "negative_points"
          ? "points"
          : "endsAt";
    return { ok: false, fieldErrors: { [key]: labels[e.reason] ?? e.reason } };
  }
  return { ok: false, error: e instanceof Error ? e.message : String(e) };
}

export async function createActivityAction(
  _prev: ActivityActionState,
  form: FormData,
): Promise<ActivityActionState> {
  await requireStaff();
  const eventId = readString(form, "eventId");

  try {
    await createActivity({
      eventId,
      sponsorId: readString(form, "sponsorId"),
      name: readString(form, "name"),
      points: Number(readString(form, "points") || "0"),
      startsAt: readDate(readString(form, "startsAt")),
      endsAt: readDate(readString(form, "endsAt")),
      isActive: readBool(form, "isActive"),
    });
  } catch (e) {
    return mapError(e);
  }
  revalidatePath(`/events/${eventId}/activities`);
  redirect(`/events/${eventId}/activities`);
}

export async function updateActivityAction(
  _prev: ActivityActionState,
  form: FormData,
): Promise<ActivityActionState> {
  await requireStaff();
  const id = readString(form, "id");
  const eventId = readString(form, "eventId");

  try {
    await updateActivity(id, {
      name: readString(form, "name"),
      points: Number(readString(form, "points") || "0"),
      startsAt: readDate(readString(form, "startsAt")),
      endsAt: readDate(readString(form, "endsAt")),
      isActive: readBool(form, "isActive"),
    });
  } catch (e) {
    return mapError(e);
  }
  revalidatePath(`/events/${eventId}/activities`);
  return { ok: true };
}

export async function toggleActivityActiveAction(
  _prev: ActivityActionState,
  form: FormData,
): Promise<ActivityActionState> {
  await requireStaff();
  const id = readString(form, "id");
  const eventId = readString(form, "eventId");
  const isActive = readString(form, "isActive") === "true";

  try {
    await setActivityActive(id, isActive);
  } catch (e) {
    return mapError(e);
  }
  revalidatePath(`/events/${eventId}/activities`);
  return { ok: true };
}
