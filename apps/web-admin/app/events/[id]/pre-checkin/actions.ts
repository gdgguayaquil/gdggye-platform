"use server";

import { revalidatePath } from "next/cache";

import { requireStaff } from "@/lib/server/auth";
import {
  bulkReviewPreCheckin,
  reviewPreCheckin,
} from "@/lib/server/pre-checkin";

export interface ReviewActionState {
  ok: boolean;
  error?: string;
}

export interface BulkReviewActionState {
  ok: boolean;
  approved: number;
  rejected: number;
  skipped: number;
  error?: string;
}

function readString(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function readAllStrings(form: FormData, key: string): string[] {
  return form
    .getAll(key)
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
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

// Bulk path. The client posts a set of hidden `ids` inputs (one per
// selected row) plus `status` and optional `reviewNotes`. We surface a
// count breakdown so the UI can render "Approved 12, skipped 1" instead
// of the raw per-row list.
export async function bulkReviewAction(
  _prev: BulkReviewActionState,
  form: FormData,
): Promise<BulkReviewActionState> {
  const initial: BulkReviewActionState = {
    ok: false,
    approved: 0,
    rejected: 0,
    skipped: 0,
  };
  const user = await requireStaff();
  const eventId = readString(form, "eventId");
  const rawStatus = readString(form, "status");
  const reviewNotes = readString(form, "reviewNotes");
  const ids = readAllStrings(form, "ids");

  if (!eventId) return { ...initial, error: "Missing eventId." };
  if (rawStatus !== "approved" && rawStatus !== "rejected") {
    return { ...initial, error: "Invalid status." };
  }
  if (ids.length === 0) {
    return { ...initial, error: "No rows selected." };
  }
  if (rawStatus === "rejected" && reviewNotes.length === 0) {
    return { ...initial, error: "Add a reason before rejecting." };
  }

  let results;
  try {
    results = await bulkReviewPreCheckin({
      ids,
      reviewerUserId: user.id,
      status: rawStatus,
      reviewNotes: reviewNotes.length > 0 ? reviewNotes : null,
    });
  } catch (e) {
    return {
      ...initial,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  const ok = results.filter((r) => r.ok).length;
  const skipped = results.length - ok;

  revalidatePath(`/events/${eventId}/pre-checkin`);
  return {
    ok: true,
    approved: rawStatus === "approved" ? ok : 0,
    rejected: rawStatus === "rejected" ? ok : 0,
    skipped,
  };
}
