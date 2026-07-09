"use client";

import * as React from "react";

import { Button } from "@gdggye/ui-kit";

import { deleteSlotAction, type AgendaActionState } from "./actions";

const initialState: AgendaActionState = { ok: false };

export function DeleteSlotButton({
  slotId,
  eventId,
}: {
  slotId: string;
  eventId: string;
}) {
  const [state, formAction, pending] = React.useActionState(
    deleteSlotAction,
    initialState,
  );
  function confirmSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!confirm("Delete this agenda slot? This can't be undone.")) {
      e.preventDefault();
    }
  }
  return (
    <form action={formAction} onSubmit={confirmSubmit}>
      <input type="hidden" name="id" value={slotId} />
      <input type="hidden" name="eventId" value={eventId} />
      <Button type="submit" variant="danger" disabled={pending}>
        {pending ? "Deleting…" : "Delete"}
      </Button>
      {state.error ? (
        <span className="ml-2 text-xs" style={{ color: "var(--c-red)" }}>
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
