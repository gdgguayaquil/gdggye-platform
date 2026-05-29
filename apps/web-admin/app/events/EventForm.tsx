"use client";

import * as React from "react";

import { Button, Input } from "@gdggye/ui-kit";

import {
  createEventAction,
  updateEventAction,
  type ActionState,
} from "./actions";

const EVENT_TYPES = [
  "devfest",
  "build_with_ai",
  "google_io",
  "meetup",
  "tech_talk",
  "conference",
  "workshop",
  "hackathon",
] as const;

const LANG_MODES = ["es", "en", "bilingual"] as const;

export interface EventFormValues {
  id?: string;
  slug: string;
  name: string;
  type: (typeof EVENT_TYPES)[number];
  year: number;
  languageMode: (typeof LANG_MODES)[number];
  startAtIso: string; // YYYY-MM-DDTHH:mm (datetime-local)
  endAtIso: string;
  timezone: string;
  venueName: string | null;
  venueAddress: string | null;
  ticketUrl: string | null;
  leaderboardEnabled: boolean;
  themeKey: string;
  summaryEs: string | null;
  summaryEn: string | null;
  expectedAttendance: string | null;
}

const initialState: ActionState = { ok: false };

export function EventForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial: EventFormValues;
}) {
  const action = mode === "create" ? createEventAction : updateEventAction;
  const [state, formAction, pending] = React.useActionState(
    action,
    initialState,
  );
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid max-w-[760px] gap-6">
      {mode === "edit" && initial.id ? (
        <input type="hidden" name="id" value={initial.id} />
      ) : null}

      <Field
        label="Slug *"
        hint="URL identifier, e.g. devfest-2027. Locked after create."
        error={fe.slug}
      >
        <Input
          name="slug"
          defaultValue={initial.slug}
          disabled={mode === "edit"}
          required
        />
      </Field>

      <Field label="Name *" error={fe.name}>
        <Input name="name" defaultValue={initial.name} required />
      </Field>

      <div className="grid gap-6 sm:grid-cols-3">
        <Field label="Type *" error={fe.type}>
          <Select name="type" defaultValue={initial.type}>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Year *" error={fe.year}>
          <Input
            name="year"
            type="number"
            min={2017}
            max={2100}
            defaultValue={initial.year}
            required
          />
        </Field>
        <Field label="Language" error={fe.languageMode}>
          <Select name="languageMode" defaultValue={initial.languageMode}>
            {LANG_MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Start *" error={fe.startAt}>
          <Input
            name="startAt"
            type="datetime-local"
            defaultValue={initial.startAtIso}
            required
          />
        </Field>
        <Field label="End *" error={fe.endAt}>
          <Input
            name="endAt"
            type="datetime-local"
            defaultValue={initial.endAtIso}
            required
          />
        </Field>
      </div>

      <Field label="Timezone">
        <Input name="timezone" defaultValue={initial.timezone} />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Venue name">
          <Input name="venueName" defaultValue={initial.venueName ?? ""} />
        </Field>
        <Field label="Venue address">
          <Input
            name="venueAddress"
            defaultValue={initial.venueAddress ?? ""}
          />
        </Field>
      </div>

      <Field label="Ticket URL">
        <Input
          name="ticketUrl"
          type="url"
          defaultValue={initial.ticketUrl ?? ""}
        />
      </Field>

      <Field label="Theme key">
        <Input name="themeKey" defaultValue={initial.themeKey} />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Summary (es)">
          <Input name="summaryEs" defaultValue={initial.summaryEs ?? ""} />
        </Field>
        <Field label="Summary (en)">
          <Input name="summaryEn" defaultValue={initial.summaryEn ?? ""} />
        </Field>
      </div>

      <Field label="Expected attendance" hint="Free text, e.g. 450+">
        <Input
          name="expectedAttendance"
          defaultValue={initial.expectedAttendance ?? ""}
        />
      </Field>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="leaderboardEnabled"
          defaultChecked={initial.leaderboardEnabled}
        />
        Leaderboard enabled
      </label>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Create event"
              : "Save changes"}
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
    >
      {children}
    </select>
  );
}
