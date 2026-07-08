"use server";

import { revalidatePath } from "next/cache";

import { requireStaff } from "@/lib/server/auth";
import { reviewPreCheckin } from "@/lib/server/pre-checkin";

export interface ReviewActionState {
  ok: boolean;
  error?: string;
}

function readString(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

async function review(
  status: "approved" | "rejected",
  form: FormData,
): Promise<ReviewActionState> {
  const user = await requireStaff();
  const id = readString(form, "id");
  const eventId = readString(form, "eventId");
  const reviewNotes = readString(form, "reviewNotes");
  if (!id || !eventId) return { ok: false, error: "Missing ids." };

  try {
    await reviewPreCheckin({
      id,
      reviewerUserId: user.id,
      status,
      reviewNotes: reviewNotes.length > 0 ? reviewNotes : null,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
  revalidatePath(`/events/${eventId}/pre-checkin`);
  return { ok: true };
}

export async function approveAction(
  _prev: ReviewActionState,
  form: FormData,
): Promise<ReviewActionState> {
  return review("approved", form);
}

export async function rejectAction(
  _prev: ReviewActionState,
  form: FormData,
): Promise<ReviewActionState> {
  return review("rejected", form);
}
