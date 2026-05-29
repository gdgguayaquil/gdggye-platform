"use client";

import * as React from "react";

import { Button, Input } from "@gdggye/ui-kit";

import {
  createActivityAction,
  updateActivityAction,
  type ActivityActionState,
} from "./actions";

export interface ActivityFormValues {
  id?: string;
  eventId: string;
  sponsorId: string;
  name: string;
  points: number;
  startsAtIso: string;
  endsAtIso: string;
  isActive: boolean;
}

export interface SponsorOption {
  id: string;
  name: string;
}

const initialState: ActivityActionState = { ok: false };

export function ActivityForm({
  mode,
  initial,
  sponsors,
}: {
  mode: "create" | "edit";
  initial: ActivityFormValues;
  sponsors: SponsorOption[];
}) {
  const action =
    mode === "create" ? createActivityAction : updateActivityAction;
  const [state, formAction, pending] = React.useActionState(
    action,
    initialState,
  );
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid max-w-[640px] gap-5">
      <input type="hidden" name="eventId" value={initial.eventId} />
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <Field label="Sponsor *">
        {mode === "create" ? (
          <Select name="sponsorId" defaultValue={initial.sponsorId}>
            <option value="" disabled>
              Pick a sponsor…
            </option>
            {sponsors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        ) : (
          <>
            <input type="hidden" name="sponsorId" value={initial.sponsorId} />
            <Input
              value={
                sponsors.find((s) => s.id === initial.sponsorId)?.name ?? ""
              }
              disabled
              readOnly
            />
          </>
        )}
      </Field>

      <Field label="Name *" error={fe.name}>
        <Input name="name" defaultValue={initial.name} required />
      </Field>

      <Field label="Points *" error={fe.points}>
        <Input
          name="points"
          type="number"
          min={0}
          defaultValue={initial.points}
          required
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Starts at">
          <Input
            name="startsAt"
            type="datetime-local"
            defaultValue={initial.startsAtIso}
          />
        </Field>
        <Field label="Ends at" error={fe.endsAt}>
          <Input
            name="endsAt"
            type="datetime-local"
            defaultValue={initial.endsAtIso}
          />
        </Field>
      </div>

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
          {pending ? "Saving…" : mode === "create" ? "Create activity" : "Save"}
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
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="eyebrow mb-2 block">{label}</label>
      {children}
      {error ? (
        <div className="mt-1 text-xs" style={{ color: "var(--c-red)" }}>
          {error}
        </div>
      ) : null}
    </div>
  );
}

function Select({
  children,
  name,
  defaultValue,
}: {
  children: React.ReactNode;
  name: string;
  defaultValue: string;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="h-11 w-full rounded-full border border-[var(--c-border)] bg-[var(--c-surface)] px-4 text-sm text-[var(--c-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-primary)]"
      required
    >
      {children}
    </select>
  );
}
