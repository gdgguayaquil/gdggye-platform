"use client";

import * as React from "react";

import { Button } from "@gdggye/ui-kit";

import { approveAction, rejectAction, type ReviewActionState } from "./actions";

const initialState: ReviewActionState = { ok: false };

export function SubmissionActions({
  submissionId,
  eventId,
}: {
  submissionId: string;
  eventId: string;
}) {
  const [appState, approve, approving] = React.useActionState(
    approveAction,
    initialState,
  );
  const [rejState, reject, rejecting] = React.useActionState(
    rejectAction,
    initialState,
  );
  const [showReject, setShowReject] = React.useState(false);

  return (
    <div className="flex flex-col items-end gap-2">
      <form action={approve} className="flex items-center gap-2">
        <input type="hidden" name="id" value={submissionId} />
        <input type="hidden" name="eventId" value={eventId} />
        <Button type="submit" variant="primary" disabled={approving}>
          {approving ? "..." : "Approve"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowReject((s) => !s)}
        >
          Reject
        </Button>
      </form>
      {showReject ? (
        <form action={reject} className="flex items-end gap-2">
          <input type="hidden" name="id" value={submissionId} />
          <input type="hidden" name="eventId" value={eventId} />
          <textarea
            name="reviewNotes"
            rows={2}
            placeholder="Reason (will be shown to attendee)"
            className="w-[260px] rounded-[var(--r-md)] border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-primary)]"
          />
          <Button type="submit" variant="danger" disabled={rejecting}>
            {rejecting ? "..." : "Confirm reject"}
          </Button>
        </form>
      ) : null}
      {(appState.error ?? rejState.error) ? (
        <span className="text-xs" style={{ color: "var(--c-red)" }}>
          {appState.error ?? rejState.error}
        </span>
      ) : null}
    </div>
  );
}
