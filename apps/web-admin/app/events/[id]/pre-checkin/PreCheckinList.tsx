"use client";

import * as React from "react";

import { Button } from "@gdggye/ui-kit";

import { SubmissionActions } from "./SubmissionActions";
import { bulkReviewAction, type BulkReviewActionState } from "./actions";

// Serialized-for-client shape. Dates are pre-formatted server-side so the
// client stays a pure display + selection layer.
export interface PreCheckinRow {
  id: string;
  status: "pending" | "approved" | "rejected";
  badgeName: string;
  dietary: string | null;
  tshirtSize: string | null;
  notes: string | null;
  photoConsent: boolean;
  reviewNotes: string | null;
  submittedAtLabel: string;
  fullName: string;
  email: string;
  userIdHint: string;
}

const SLOT_COLS = "32px 200px 100px 1fr 80px 80px 80px 280px";

const initialBulk: BulkReviewActionState = {
  ok: false,
  approved: 0,
  rejected: 0,
  skipped: 0,
};

export function PreCheckinList({
  eventId,
  rows,
}: {
  eventId: string;
  rows: PreCheckinRow[];
}) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = React.useState<
    "idle" | "approving" | "rejecting"
  >("idle");
  const [state, dispatch, pending] = React.useActionState(
    bulkReviewAction,
    initialBulk,
  );

  const pendingRows = rows.filter((r) => r.status === "pending");
  const pendingIds = React.useMemo(
    () => new Set(pendingRows.map((r) => r.id)),
    [pendingRows],
  );

  // If a revalidation drops a row from pending, prune it from the
  // selection so the bulk bar reflects only actionable rows.
  React.useEffect(() => {
    setSelected((prev) => {
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (pendingIds.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [pendingIds]);

  // A successful bulk action clears the selection and closes the reject
  // sheet. Errors stay visible so the operator can retry.
  React.useEffect(() => {
    if (state.ok) {
      setSelected(new Set());
      setBulkMode("idle");
    }
  }, [state.ok, state.approved, state.rejected, state.skipped]);

  const allPendingSelected =
    pendingRows.length > 0 && selected.size === pendingRows.length;
  const someSelected = selected.size > 0;

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllPending = () => {
    setSelected((prev) => {
      if (prev.size === pendingRows.length) return new Set();
      return new Set(pendingRows.map((r) => r.id));
    });
  };

  return (
    <div>
      <BulkBar
        selectedCount={selected.size}
        selectedIds={[...selected]}
        eventId={eventId}
        bulkMode={bulkMode}
        setBulkMode={setBulkMode}
        dispatch={dispatch}
        pending={pending}
        state={state}
      />

      <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--c-border)]">
        <div
          className="grid gap-4 border-b border-[var(--c-border)] bg-[var(--c-surface)] px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-[var(--c-text-muted)]"
          style={{ gridTemplateColumns: SLOT_COLS }}
        >
          <div>
            <input
              type="checkbox"
              checked={allPendingSelected}
              // Show indeterminate when a partial set of pending rows is
              // selected — a tiny UX detail but the "invalid" state
              // otherwise reads as "nothing selected" and confuses users.
              ref={(el) => {
                if (el) el.indeterminate = someSelected && !allPendingSelected;
              }}
              onChange={toggleAllPending}
              disabled={pendingRows.length === 0}
              aria-label="Select all pending"
            />
          </div>
          <div>Attendee</div>
          <div>Status</div>
          <div>Badge / dietary / notes</div>
          <div>Shirt</div>
          <div>Photo</div>
          <div>Submitted</div>
          <div />
        </div>
        {rows.length === 0 ? (
          <div className="px-5 py-10 text-center text-[var(--c-text-muted)]">
            Nothing to review.
          </div>
        ) : (
          rows.map((r) => {
            const isPending = r.status === "pending";
            const isSelected = selected.has(r.id);
            return (
              <div
                key={r.id}
                className="grid items-start gap-4 border-b border-[var(--c-border)] px-5 py-4 last:border-b-0"
                style={{
                  gridTemplateColumns: SLOT_COLS,
                  background: isSelected
                    ? "color-mix(in srgb, var(--c-primary) 6%, transparent)"
                    : "transparent",
                }}
              >
                <div className="pt-1">
                  {isPending ? (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRow(r.id)}
                      aria-label={`Select ${r.fullName || r.email}`}
                    />
                  ) : null}
                </div>
                <div>
                  <div className="font-display font-semibold">
                    {r.fullName || "—"}
                  </div>
                  <div className="font-mono text-xs text-[var(--c-text-subtle)]">
                    {r.email || r.userIdHint}
                  </div>
                </div>
                <div>
                  <span
                    className={`chip ${
                      r.status === "approved"
                        ? "chip-green"
                        : r.status === "rejected"
                          ? "chip-red"
                          : "chip-yellow"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                <div>
                  <div className="font-display font-semibold">
                    {r.badgeName}
                  </div>
                  {r.dietary ? (
                    <div className="text-xs text-[var(--c-text-muted)]">
                      Diet: {r.dietary}
                    </div>
                  ) : null}
                  {r.notes ? (
                    <div className="text-xs text-[var(--c-text-subtle)]">
                      "{r.notes}"
                    </div>
                  ) : null}
                  {r.status === "rejected" && r.reviewNotes ? (
                    <div
                      className="mt-1 text-xs"
                      style={{ color: "var(--c-red)" }}
                    >
                      Rejected: {r.reviewNotes}
                    </div>
                  ) : null}
                </div>
                <div className="font-mono text-xs">{r.tshirtSize ?? "—"}</div>
                <div className="font-mono text-xs">
                  {r.photoConsent ? "yes" : "no"}
                </div>
                <div className="font-mono text-xs text-[var(--c-text-muted)]">
                  {r.submittedAtLabel}
                </div>
                <div>
                  {isPending ? (
                    <SubmissionActions submissionId={r.id} eventId={eventId} />
                  ) : (
                    <span className="text-xs text-[var(--c-text-subtle)]">
                      reviewed
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function BulkBar({
  selectedCount,
  selectedIds,
  eventId,
  bulkMode,
  setBulkMode,
  dispatch,
  pending,
  state,
}: {
  selectedCount: number;
  selectedIds: string[];
  eventId: string;
  bulkMode: "idle" | "approving" | "rejecting";
  setBulkMode: (m: "idle" | "approving" | "rejecting") => void;
  dispatch: (form: FormData) => void;
  pending: boolean;
  state: BulkReviewActionState;
}) {
  const summary = state.ok
    ? `Approved ${state.approved}, rejected ${state.rejected}${
        state.skipped > 0 ? `, skipped ${state.skipped}` : ""
      }.`
    : null;

  if (selectedCount === 0) {
    return (
      <div className="mb-4 flex items-center justify-between text-xs text-[var(--c-text-muted)]">
        <span>Select pending rows to enable bulk actions.</span>
        {summary ? (
          <span style={{ color: "var(--c-green)" }}>{summary}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="mb-4 rounded-[var(--r-md)] border px-4 py-3"
      style={{
        borderColor: "var(--c-primary)",
        background: "color-mix(in srgb, var(--c-primary) 6%, transparent)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="font-mono text-xs uppercase tracking-wider text-[var(--c-text)]">
          {selectedCount} selected
        </div>
        <div className="flex items-center gap-2">
          <form action={dispatch}>
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="status" value="approved" />
            {selectedIds.map((id) => (
              <input key={id} type="hidden" name="ids" value={id} />
            ))}
            <Button
              type="submit"
              variant="primary"
              disabled={pending}
              onClick={() => setBulkMode("approving")}
            >
              {pending && bulkMode === "approving"
                ? "..."
                : `Approve ${selectedCount}`}
            </Button>
          </form>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setBulkMode(bulkMode === "rejecting" ? "idle" : "rejecting")
            }
          >
            Reject {selectedCount}
          </Button>
        </div>
      </div>

      {bulkMode === "rejecting" ? (
        <form action={dispatch} className="mt-3 flex flex-wrap items-end gap-2">
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="status" value="rejected" />
          {selectedIds.map((id) => (
            <input key={id} type="hidden" name="ids" value={id} />
          ))}
          <textarea
            name="reviewNotes"
            rows={2}
            required
            placeholder="Reason (shown to every rejected attendee)"
            className="flex-1 min-w-[280px] rounded-[var(--r-md)] border border-[var(--c-border)] bg-[var(--c-bg)] px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-primary)]"
          />
          <Button type="submit" variant="ghost" disabled={pending}>
            {pending && bulkMode === "rejecting"
              ? "..."
              : `Confirm reject ${selectedCount}`}
          </Button>
        </form>
      ) : null}

      {state.error ? (
        <div className="mt-2 text-xs" style={{ color: "var(--c-red)" }}>
          {state.error}
        </div>
      ) : null}
    </div>
  );
}
