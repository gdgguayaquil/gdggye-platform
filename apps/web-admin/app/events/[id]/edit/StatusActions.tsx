"use client";

import * as React from "react";

import { Button } from "@gdggye/ui-kit";
import type { EventStatus } from "@gdggye/backend-core";

import { transitionEventAction, type ActionState } from "../../actions";

const NEXT_LABEL: Record<EventStatus, { next: EventStatus; label: string }[]> =
  {
    draft: [{ next: "published", label: "Publish" }],
    published: [
      { next: "live", label: "Mark live" },
      { next: "closed", label: "Close" },
    ],
    live: [{ next: "closed", label: "Close" }],
    closed: [],
  };

const initialState: ActionState = { ok: false };

export function StatusActions({
  id,
  status,
}: {
  id: string;
  status: EventStatus;
}) {
  const [state, formAction, pending] = React.useActionState(
    transitionEventAction,
    initialState,
  );
  const transitions = NEXT_LABEL[status];

  if (transitions.length === 0) {
    return (
      <div className="rounded-[var(--r-md)] border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm text-[var(--c-text-muted)]">
        Event is {status}. No further transitions allowed.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form action={formAction} className="contents">
        <input type="hidden" name="id" value={id} />
        {transitions.map((t) => (
          <Button
            key={t.next}
            type="submit"
            name="next"
            value={t.next}
            variant={t.next === "published" ? "primary" : "secondary"}
            disabled={pending}
          >
            {t.label}
          </Button>
        ))}
      </form>
      {state.error ? (
        <span className="text-sm" style={{ color: "var(--c-red)" }}>
          {state.error}
        </span>
      ) : null}
    </div>
  );
}
