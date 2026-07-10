"use client";

import * as React from "react";

import type { SystemRole } from "@gdggye/backend-core";
import { Button } from "@gdggye/ui-kit";

import { setUserRoleAction, type SetRoleActionState } from "./actions";

const ROLES: SystemRole[] = ["attendee", "organizer", "admin"];
const INITIAL: SetRoleActionState = { ok: false };

// Per-row role picker. The Save button only appears once the selection
// differs from the stored role, so the table stays quiet until you act.
export function UserRoleControl({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: SystemRole;
}) {
  const [state, dispatch, pending] = React.useActionState(
    setUserRoleAction,
    INITIAL,
  );
  const [selected, setSelected] = React.useState<SystemRole>(currentRole);

  // After a successful save the server revalidates and currentRole updates;
  // resync the selection so the Save button collapses. Adjusted during render,
  // keyed on the action result (new object once per dispatch).
  const [handled, setHandled] = React.useState(state);
  if (state !== handled) {
    setHandled(state);
    if (state.ok) setSelected(currentRole);
  }

  const dirty = selected !== currentRole;

  return (
    <form action={dispatch} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="role" value={selected} />
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value as SystemRole)}
        disabled={pending}
        aria-label="System role"
        className="rounded-[var(--r-md)] border border-[var(--c-border)] bg-[var(--c-bg)] px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-primary)]"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      {dirty ? (
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "…" : "Save"}
        </Button>
      ) : null}
      {state.error ? (
        <span className="text-xs" style={{ color: "var(--c-red)" }}>
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
