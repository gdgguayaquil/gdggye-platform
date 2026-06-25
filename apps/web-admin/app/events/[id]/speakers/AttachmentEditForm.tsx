"use client";

import * as React from "react";

import { Button, Input } from "@gdggye/ui-kit";

import { updateAttachmentAction, type AttachmentActionState } from "./actions";

export interface AttachmentFormValues {
  id: string;
  eventId: string;
  displayOrder: number;
  track: string | null;
  isHeadliner: boolean;
  isActive: boolean;
}

const initialState: AttachmentActionState = { ok: false };

export function AttachmentEditForm({
  initial,
}: {
  initial: AttachmentFormValues;
}) {
  const [state, formAction, pending] = React.useActionState(
    updateAttachmentAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid max-w-[640px] gap-5">
      <input type="hidden" name="id" value={initial.id} />
      <input type="hidden" name="eventId" value={initial.eventId} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Display order">
          <Input
            name="displayOrder"
            type="number"
            min={0}
            defaultValue={initial.displayOrder}
          />
        </Field>
        <Field label="Track">
          <Input name="track" defaultValue={initial.track ?? ""} />
        </Field>
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="isHeadliner"
          defaultChecked={initial.isHeadliner}
        />
        Headliner (keynote badge)
      </label>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={initial.isActive}
        />
        Active at this event
      </label>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        {state.ok ? (
          <span className="text-sm" style={{ color: "var(--c-green)" }}>
            Saved.
          </span>
        ) : null}
        {state.error ? (
          <span className="text-sm" style={{ color: "var(--c-red)" }}>
            {state.error}
          </span>
        ) : null}
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="eyebrow mb-2 block">{label}</label>
      {children}
    </div>
  );
}
