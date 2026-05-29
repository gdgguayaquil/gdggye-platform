"use client";

import * as React from "react";

import { Button, Input } from "@gdggye/ui-kit";

import {
  createSponsorAction,
  updateSponsorAction,
  type SponsorActionState,
} from "./actions";

export interface SponsorFormValues {
  id?: string;
  eventId: string;
  name: string;
  tier: string | null;
  logoUrl: string | null;
  description: string | null;
  boothLabel: string | null;
  isActive: boolean;
}

const initialState: SponsorActionState = { ok: false };

export function SponsorForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial: SponsorFormValues;
}) {
  const action = mode === "create" ? createSponsorAction : updateSponsorAction;
  const [state, formAction, pending] = React.useActionState(
    action,
    initialState,
  );
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid max-w-[640px] gap-5">
      <input type="hidden" name="eventId" value={initial.eventId} />
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <Field label="Name *" error={fe.name}>
        <Input name="name" defaultValue={initial.name} required />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Tier"
          hint="Free text. Typical: platinum / gold / silver / community."
        >
          <Input name="tier" defaultValue={initial.tier ?? ""} />
        </Field>
        <Field label="Booth label">
          <Input name="boothLabel" defaultValue={initial.boothLabel ?? ""} />
        </Field>
      </div>

      <Field label="Logo URL">
        <Input name="logoUrl" type="url" defaultValue={initial.logoUrl ?? ""} />
      </Field>

      <Field label="Description">
        <Input name="description" defaultValue={initial.description ?? ""} />
      </Field>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={initial.isActive}
        />
        Active (scannable for points)
      </label>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : mode === "create" ? "Create sponsor" : "Save"}
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
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="eyebrow mb-2 block">{label}</label>
      {children}
      {hint ? (
        <div className="mt-1 text-xs text-[var(--c-text-subtle)]">{hint}</div>
      ) : null}
      {error ? (
        <div className="mt-1 text-xs" style={{ color: "var(--c-red)" }}>
          {error}
        </div>
      ) : null}
    </div>
  );
}
