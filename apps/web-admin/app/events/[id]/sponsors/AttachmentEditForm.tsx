"use client";

import * as React from "react";

import { Button, Input } from "@gdggye/ui-kit";

import { updateAttachmentAction, type AttachmentActionState } from "./actions";

export interface AttachmentFormValues {
  id: string;
  eventId: string;
  tier: string | null;
  boothLabel: string | null;
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
        <Field
          label="Tier"
          hint="Typical: platinum / gold / silver / community."
        >
          <Input name="tier" defaultValue={initial.tier ?? ""} />
        </Field>
        <Field label="Booth label">
          <Input name="boothLabel" defaultValue={initial.boothLabel ?? ""} />
        </Field>
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={initial.isActive}
        />
        Active at this event (scannable for points)
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
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="eyebrow mb-2 block">{label}</label>
      {children}
      {hint ? (
        <div className="mt-1 text-xs text-[var(--c-text-subtle)]">{hint}</div>
      ) : null}
    </div>
  );
}
