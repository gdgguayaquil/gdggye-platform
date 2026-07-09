"use client";

import Link from "next/link";
import * as React from "react";

import { Button, Input } from "@gdggye/ui-kit";

import {
  attachAction,
  createAndAttachAction,
  detachAction,
  type AttachmentActionState,
} from "./actions";

export interface SpeakerOption {
  id: string;
  slug: string;
  name: string;
  photoUrl: string | null;
}

export interface AttachmentRow {
  id: string;
  speakerId: string;
  speaker: SpeakerOption & {
    roleEs: string | null;
    roleEn: string | null;
  };
  displayOrder: number;
  track: string | null;
  isHeadliner: boolean;
  isActive: boolean;
}

const initialState: AttachmentActionState = { ok: false };

const ATTACHMENT_COLS = "60px minmax(0, 2fr) 80px 140px 120px 110px 160px";

export function EventSpeakersManager({
  eventId,
  attachments,
  allSpeakers,
}: {
  eventId: string;
  attachments: AttachmentRow[];
  allSpeakers: SpeakerOption[];
}) {
  const attachedIds = React.useMemo(
    () => new Set(attachments.map((a) => a.speakerId)),
    [attachments],
  );
  const candidates = React.useMemo(
    () => allSpeakers.filter((s) => !attachedIds.has(s.id)),
    [allSpeakers, attachedIds],
  );

  return (
    <>
      <div className="mb-10 overflow-x-auto rounded-[var(--r-lg)] border border-[var(--c-border)]">
        <div
          className="grid gap-4 border-b border-[var(--c-border)] bg-[var(--c-surface)] px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-[var(--c-text-muted)]"
          style={{ gridTemplateColumns: ATTACHMENT_COLS, minWidth: 900 }}
        >
          <div />
          <div>Speaker</div>
          <div>Order</div>
          <div>Track</div>
          <div>Headliner</div>
          <div>Active</div>
          <div />
        </div>
        {attachments.length === 0 ? (
          <div className="px-5 py-10 text-center text-[var(--c-text-muted)]">
            No speakers attached to this event yet.
          </div>
        ) : (
          attachments.map((a) => (
            <AttachmentRowView key={a.id} eventId={eventId} attachment={a} />
          ))
        )}
      </div>

      <AttachExisting eventId={eventId} candidates={candidates} />
    </>
  );
}

function AttachmentRowView({
  eventId,
  attachment,
}: {
  eventId: string;
  attachment: AttachmentRow;
}) {
  const [, detach, detaching] = React.useActionState(
    detachAction,
    initialState,
  );

  return (
    <div
      className="grid items-center gap-4 border-b border-[var(--c-border)] px-5 py-4 last:border-b-0"
      style={{ gridTemplateColumns: ATTACHMENT_COLS, minWidth: 900 }}
    >
      <div
        className="overflow-hidden rounded-full border border-[var(--c-border)] bg-[var(--c-surface)]"
        style={{ width: 40, height: 40 }}
      >
        {attachment.speaker.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={attachment.speaker.photoUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-xs text-[var(--c-text-muted)]">
            {attachment.speaker.name.slice(0, 1)}
          </div>
        )}
      </div>
      <div>
        <div className="font-display font-semibold">
          {attachment.speaker.name}
        </div>
        <div className="font-mono text-xs text-[var(--c-text-subtle)]">
          {attachment.speaker.slug}
        </div>
      </div>
      <div className="font-mono text-xs">{attachment.displayOrder}</div>
      <div className="font-mono text-xs text-[var(--c-text-muted)]">
        {attachment.track ?? "—"}
      </div>
      <div>
        {attachment.isHeadliner ? (
          <span className="chip chip-blue">keynote</span>
        ) : (
          <span className="font-mono text-xs text-[var(--c-text-subtle)]">
            —
          </span>
        )}
      </div>
      <div>
        <span
          className={`chip ${attachment.isActive ? "chip-green" : "chip-neutral"}`}
        >
          {attachment.isActive ? "active" : "inactive"}
        </span>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button asChild variant="secondary">
          <Link href={`/events/${eventId}/speakers/${attachment.id}/edit`}>
            Edit
          </Link>
        </Button>
        <form action={detach}>
          <input type="hidden" name="id" value={attachment.id} />
          <input type="hidden" name="eventId" value={eventId} />
          <Button type="submit" variant="danger" disabled={detaching}>
            {detaching ? "Detaching…" : "Detach"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function AttachExisting({
  eventId,
  candidates,
}: {
  eventId: string;
  candidates: SpeakerOption[];
}) {
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<SpeakerOption | null>(null);
  const [state, attach, pending] = React.useActionState(
    attachAction,
    initialState,
  );
  const dialogRef = React.useRef<HTMLDialogElement | null>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return candidates.slice(0, 8);
    return candidates
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [query, candidates]);

  // Clear the picker after a successful attach. Adjusted during render (not
  // in an effect) keyed on the action result, which useActionState replaces
  // once per dispatch.
  const [handledResult, setHandledResult] = React.useState(state);
  if (state !== handledResult) {
    setHandledResult(state);
    if (state.ok) {
      setSelected(null);
      setQuery("");
    }
  }

  return (
    <div className="rounded-[var(--r-lg)] border border-[var(--c-border)] p-6">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold">
            Attach a speaker
          </h2>
          <p className="text-sm text-[var(--c-text-muted)]">
            Search the global speaker list, or create a new one.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => dialogRef.current?.showModal()}
        >
          + New speaker
        </Button>
      </div>

      {selected ? (
        <form action={attach} className="grid gap-4">
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="speakerId" value={selected.id} />
          <SelectedSpeakerSummary
            selected={selected}
            onChange={() => setSelected(null)}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Display order">
              <Input
                name="displayOrder"
                type="number"
                min={0}
                defaultValue={0}
              />
            </Field>
            <Field label="Track">
              <Input name="track" placeholder="Plenaria / Hands-on" />
            </Field>
            <Field label="Headliner">
              <label className="flex h-11 items-center gap-2 text-sm">
                <input type="checkbox" name="isHeadliner" />
                Show keynote badge
              </label>
            </Field>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Attaching…" : "Attach speaker"}
            </Button>
            {state.error ? (
              <span className="text-sm" style={{ color: "var(--c-red)" }}>
                {state.error}
              </span>
            ) : null}
          </div>
        </form>
      ) : (
        <div className="grid gap-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or slug…"
            aria-label="Search speakers"
          />
          <div className="grid gap-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-[var(--c-text-muted)]">
                {candidates.length === 0
                  ? "Every speaker is already attached. Create a new one →"
                  : "No matches. Try a different name, or create a new speaker."}
              </div>
            ) : (
              filtered.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelected(s)}
                  className="flex items-center gap-3 rounded-[var(--r-md)] border border-transparent px-3 py-2 text-left transition-colors hover:border-[var(--c-border)] hover:bg-[var(--c-surface)]"
                >
                  <div
                    className="overflow-hidden rounded-full border border-[var(--c-border)] bg-[var(--c-surface)]"
                    style={{ width: 32, height: 32 }}
                  >
                    {s.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.photoUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-display text-xs text-[var(--c-text-muted)]">
                        {s.name.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-display font-semibold">{s.name}</div>
                    <div className="font-mono text-xs text-[var(--c-text-subtle)]">
                      {s.slug}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <CreateSpeakerDialog
        ref={dialogRef}
        eventId={eventId}
        onCreated={() => dialogRef.current?.close()}
      />
    </div>
  );
}

function SelectedSpeakerSummary({
  selected,
  onChange,
}: {
  selected: SpeakerOption;
  onChange: () => void;
}) {
  return (
    <div className="rounded-[var(--r-md)] border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="overflow-hidden rounded-full border border-[var(--c-border)] bg-[var(--c-bg)]"
            style={{ width: 40, height: 40 }}
          >
            {selected.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.photoUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-xs text-[var(--c-text-muted)]">
                {selected.name.slice(0, 1)}
              </div>
            )}
          </div>
          <div>
            <div className="font-display font-semibold">{selected.name}</div>
            <div className="font-mono text-xs text-[var(--c-text-subtle)]">
              {selected.slug}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onChange}
          className="text-xs text-[var(--c-text-muted)] underline"
        >
          Change
        </button>
      </div>
    </div>
  );
}

interface DialogProps {
  eventId: string;
  onCreated: () => void;
}

const CreateSpeakerDialog = React.forwardRef<HTMLDialogElement, DialogProps>(
  function CreateSpeakerDialog({ eventId, onCreated }, ref) {
    const [state, create, pending] = React.useActionState(
      createAndAttachAction,
      initialState,
    );
    const fe = state.fieldErrors ?? {};
    const [name, setName] = React.useState("");
    const [slugManual, setSlugManual] = React.useState("");
    const [slugTouched, setSlugTouched] = React.useState(false);

    // Slug auto-follows the name until the user edits it. Derived during
    // render — no effect syncing state to state.
    const slug = slugTouched
      ? slugManual
      : name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

    // Reset the form after a successful create. Adjusted during render keyed
    // on the action result, which useActionState replaces once per dispatch.
    const [handledResult, setHandledResult] = React.useState(state);
    if (state !== handledResult) {
      setHandledResult(state);
      if (state.ok) {
        setName("");
        setSlugManual("");
        setSlugTouched(false);
      }
    }

    // Closing the dialog is an imperative DOM call (no React state), so it
    // stays in an effect.
    React.useEffect(() => {
      if (state.ok) onCreated();
    }, [state.ok, onCreated]);

    return (
      <dialog
        ref={ref}
        className="m-auto w-[min(640px,calc(100vw-32px))] rounded-[var(--r-lg)] border border-[var(--c-border)] bg-[var(--c-bg)] p-0 text-[var(--c-text)] backdrop:bg-black/40"
      >
        <form
          action={create}
          encType="multipart/form-data"
          className="grid gap-5 p-6"
        >
          <input type="hidden" name="eventId" value={eventId} />

          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold">
                New speaker
              </h2>
              <p className="text-sm text-[var(--c-text-muted)]">
                Creates a global speaker and attaches to this event.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                (ref as React.RefObject<HTMLDialogElement>).current?.close()
              }
              className="text-sm text-[var(--c-text-muted)] underline"
            >
              Cancel
            </button>
          </div>

          <Field label="Name *" error={fe.name}>
            <Input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>

          <Field
            label="Slug *"
            hint="Lowercase letters, numbers, and dashes."
            error={fe.slug}
          >
            <Input
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlugManual(e.target.value);
                setSlugTouched(true);
              }}
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Role (es)">
              <Input name="roleEs" />
            </Field>
            <Field label="Role (en)">
              <Input name="roleEn" />
            </Field>
          </div>

          <Field label="City">
            <Input name="city" />
          </Field>

          <Field label="Photo">
            <input
              type="file"
              name="photo"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="text-sm"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Display order">
              <Input
                name="displayOrder"
                type="number"
                min={0}
                defaultValue={0}
              />
            </Field>
            <Field label="Track">
              <Input name="track" />
            </Field>
            <Field label="Headliner">
              <label className="flex h-11 items-center gap-2 text-sm">
                <input type="checkbox" name="isHeadliner" />
                Keynote badge
              </label>
            </Field>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Creating…" : "Create + attach"}
            </Button>
            {state.error ? (
              <span className="text-sm" style={{ color: "var(--c-red)" }}>
                {state.error}
              </span>
            ) : null}
          </div>
        </form>
      </dialog>
    );
  },
);

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
