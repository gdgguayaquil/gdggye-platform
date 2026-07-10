"use server";

import { revalidatePath } from "next/cache";

import {
  PointAdjustmentInvalid,
  type PointAdjustmentInvalidReason,
} from "@gdggye/backend-core";

import { requireStaff } from "@/lib/server/auth";
import { adjustEventPoints } from "@/lib/server/attendees";

export interface AdjustPointsActionState {
  ok: boolean;
  error?: string;
}

function readString(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

const REASON_COPY: Record<PointAdjustmentInvalidReason, string> = {
  not_an_integer: "Points must be a whole number.",
  zero: "Enter a non-zero adjustment.",
  out_of_bounds: "That adjustment is too large — check for an extra digit.",
  missing_reason: "Add a reason — it's stored as the audit note.",
};

export async function adjustPointsAction(
  _prev: AdjustPointsActionState,
  form: FormData,
): Promise<AdjustPointsActionState> {
  const actor = await requireStaff();
  const eventId = readString(form, "eventId");
  const userId = readString(form, "userId");
  const reason = readString(form, "reason");
  const pointsRaw = readString(form, "points");

  if (!eventId || !userId) return { ok: false, error: "Missing ids." };

  // Parse here so a stray "12x" becomes a clean message rather than a NaN
  // reaching the use-case. The use-case still re-validates the integer.
  const points = Number(pointsRaw);
  if (pointsRaw === "" || !Number.isFinite(points)) {
    return { ok: false, error: "Enter a whole number of points." };
  }

  try {
    await adjustEventPoints({
      eventId,
      userId,
      points,
      reason,
      actorId: actor.id,
    });
  } catch (e) {
    if (e instanceof PointAdjustmentInvalid) {
      return { ok: false, error: REASON_COPY[e.reason] };
    }
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  revalidatePath(`/events/${eventId}/attendees`);
  return { ok: true };
}
