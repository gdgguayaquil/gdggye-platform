"use client";

import * as React from "react";

import { Button, Input } from "@gdggye/ui-kit";

import {
  createSlotAction,
  updateSlotAction,
  type AgendaActionState,
} from "./actions";

export interface SpeakerChoice {
  id: string;
  name: string;
  slug: string;
  photoUrl: string | null;
}

export interface AgendaSlotFormValues {
  id?: string;
  eventId: string;
  startAtLocal: string; // already formatted in event timezone
  durationMinutes: number;
  titleEs: string;
  titleEn: string;
  track: string | null;
  room: string;
  displayOrder: number;
  speakerIds: string[];
}

const initialState: AgendaActionState = { ok: false };

export function AgendaSlotForm({
  mode,
  initial,
  speakers,
  eventTimezone,
}: {
  mode: "create" | "edit";
  initial: AgendaSlotFormValues;
  speakers: SpeakerChoice[];
  eventTimezone: string;
}) {
  const action = mode === "create" ? createSlotAction : updateSlotAction;
  const [state, formAction, pending] = React.useActionState(
    action,
    initialState,
  );
  const fe = state.fieldErrors ?? {};

  const [query, setQuery] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<string[]>(
    initial.speakerIds,
  );

  function toggleSpeaker(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function moveSpeaker(id: string, delta: -1 | 1) {
    setSelectedIds((prev) => {
      const i = prev.indexOf(id);
      if (i < 0) return prev;
      const j = i + delta;
      if (j < 0 || j >= prev.length) return prev;
      const next = prev.slice();
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });
  }

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return speakers;
    return speakers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q),
    );
  }, [query, speakers]);

  const selectedSpeakers = React.useMemo(() => {
    const byId = new Map(speakers.map((s) => [s.id, s]));
    return selectedIds
      .map((id) => byId.get(id))
      .filter((x): x is SpeakerChoice => x !== undefined);
  }, [selectedIds, speakers]);

  return (
    <form action={formAction} className="grid max-w-[720px] gap-5">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <input type="hidden" name="eventId" value={initial.eventId} />
      {/* The multi-select submits ordered ids via repeated `speakerIds` keys. */}
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name="speakerIds" value={id} />
      ))}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label={`Start (${eventTimezone}) *`}
          error={fe.startAt}
          hint="Local clock time at the event venue."
        >
          <Input
            name="startAtLocal"
            type="datetime-local"
            defaultValue={initial.startAtLocal}
            required
          />
        </Field>
        <Field label="Duration (minutes) *" error={fe.durationMinutes}>
          <Input
            name="durationMinutes"
            type="number"
            min={0}
            defaultValue={initial.durationMinutes}
            required
          />
        </Field>
      </div>

      <Field label="Title (es) *" error={fe.titleEs}>
        <Input
          name="titleEs"
          defaultValue={initial.titleEs}
          placeholder="Keynote: Agentes en producción"
          required
        />
      </Field>
      <Field label="Title (en) *">
        <Input
          name="titleEn"
          defaultValue={initial.titleEn}
          placeholder="Keynote: Agents in production"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Track" hint="e.g. Plenaria, Hands-on, AI Engineering.">
          <Input name="track" defaultValue={initial.track ?? ""} />
        </Field>
        <Field label="Room *">
          <Input
            name="room"
            defaultValue={initial.room}
            placeholder="Auditorio A"
            required
          />
        </Field>
        <Field
          label="Display order"
          hint="Tie-breaker when multiple slots share a start time."
        >
          <Input
            name="displayOrder"
            type="number"
            min={0}
            defaultValue={initial.displayOrder}
          />
        </Field>
      </div>

      <div>
        <label className="eyebrow mb-2 block">Speakers</label>
        <div className="text-xs text-[var(--c-text-subtle)] mb-3">
          Pick from the global speaker list. Order here = render order on the
          marketing site. Empty = a break or unannounced slot.
        </div>

        {selectedSpeakers.length > 0 ? (
          <div className="mb-4 rounded-[var(--r-md)] border border-[var(--c-border)] bg-[var(--c-surface)] p-3">
            <div className="eyebrow mb-2 text-[10px]">Selected</div>
            <div className="grid gap-2">
              {selectedSpeakers.map((sp, i) => (
                <div
                  key={sp.id}
                  className="flex items-center justify-between gap-2 rounded-[var(--r-md)] border border-[var(--c-border)] bg-[var(--c-bg)] px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-[var(--c-text-subtle)]">
                      {i + 1}.
                    </span>
                    <span
                      className="inline-block overflow-hidden rounded-full border border-[var(--c-border)] bg-[var(--c-surface)]"
                      style={{ width: 28, height: 28 }}
                    >
                      {sp.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={sp.photoUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </span>
                    <span className="font-display font-semibold">
                      {sp.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveSpeaker(sp.id, -1)}
                      className="rounded border border-[var(--c-border)] px-2 py-1 font-mono text-xs hover:bg-[var(--c-surface)]"
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSpeaker(sp.id, 1)}
                      className="rounded border border-[var(--c-border)] px-2 py-1 font-mono text-xs hover:bg-[var(--c-surface)]"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSpeaker(sp.id)}
                      className="rounded border border-[var(--c-border)] px-2 py-1 text-xs text-[var(--c-text-muted)] underline hover:text-[var(--c-text)]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search speakers by name or slug…"
          aria-label="Search speakers"
        />
        <div className="mt-3 max-h-[260px] overflow-y-auto rounded-[var(--r-md)] border border-[var(--c-border)]">
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-sm text-[var(--c-text-muted)]">
              No speakers match.
            </div>
          ) : (
            filtered.map((sp) => {
              const checked = selectedIds.includes(sp.id);
              return (
                <label
                  key={sp.id}
                  className="flex cursor-pointer items-center gap-3 border-b border-[var(--c-border)] px-3 py-2 last:border-b-0 hover:bg-[var(--c-surface)]"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSpeaker(sp.id)}
                  />
                  <span
                    className="inline-block overflow-hidden rounded-full border border-[var(--c-border)] bg-[var(--c-surface)]"
                    style={{ width: 28, height: 28 }}
                  >
                    {sp.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={sp.photoUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </span>
                  <div className="flex-1">
                    <div className="font-display text-sm font-semibold">
                      {sp.name}
                    </div>
                    <div className="font-mono text-xs text-[var(--c-text-subtle)]">
                      {sp.slug}
                    </div>
                  </div>
                </label>
              );
            })
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : mode === "create" ? "Create slot" : "Save"}
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
