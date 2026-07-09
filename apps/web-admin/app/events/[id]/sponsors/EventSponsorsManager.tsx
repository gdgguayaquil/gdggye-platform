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

export interface SponsorOption {
  id: string;
  slug: string;
  name: string;
  defaultTier: string | null;
}

export interface AttachmentRow {
  id: string;
  sponsorId: string;
  sponsor: SponsorOption;
  tier: string | null;
  boothLabel: string | null;
  isActive: boolean;
}

const initialState: AttachmentActionState = { ok: false };

const ATTACHMENT_COLS = "minmax(0, 2fr) 140px 120px 110px 160px";

export function EventSponsorsManager({
  eventId,
  attachments,
  allSponsors,
}: {
  eventId: string;
  attachments: AttachmentRow[];
  allSponsors: SponsorOption[];
}) {
  const attachedIds = React.useMemo(
    () => new Set(attachments.map((a) => a.sponsorId)),
    [attachments],
  );
  const candidates = React.useMemo(
    () => allSponsors.filter((s) => !attachedIds.has(s.id)),
    [allSponsors, attachedIds],
  );

  return (
    <>
      {/* Existing attachments */}
      <div className="mb-10 overflow-x-auto rounded-[var(--r-lg)] border border-[var(--c-border)]">
        <div
          className="grid gap-4 border-b border-[var(--c-border)] bg-[var(--c-surface)] px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-[var(--c-text-muted)]"
          style={{ gridTemplateColumns: ATTACHMENT_COLS, minWidth: 760 }}
        >
          <div>Sponsor</div>
          <div>Tier</div>
          <div>Booth</div>
          <div>Active</div>
          <div />
        </div>
        {attachments.length === 0 ? (
          <div className="px-5 py-10 text-center text-[var(--c-text-muted)]">
            No sponsors attached to this event yet.
          </div>
        ) : (
          attachments.map((a) => (
            <AttachmentRowView key={a.id} eventId={eventId} attachment={a} />
          ))
        )}
      </div>

      {/* Attach existing */}
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
      style={{ gridTemplateColumns: ATTACHMENT_COLS, minWidth: 760 }}
    >
      <div>
        <div className="font-display font-semibold">
          {attachment.sponsor.name}
        </div>
        <div className="font-mono text-xs text-[var(--c-text-subtle)]">
          {attachment.sponsor.slug}
        </div>
      </div>
      <div className="font-mono text-xs text-[var(--c-text-muted)]">
        {attachment.tier ?? "—"}
      </div>
      <div className="font-mono text-xs">{attachment.boothLabel ?? "—"}</div>
      <div>
        <span
          className={`chip ${attachment.isActive ? "chip-green" : "chip-neutral"}`}
        >
          {attachment.isActive ? "active" : "inactive"}
        </span>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button asChild variant="secondary">
          <Link href={`/events/${eventId}/sponsors/${attachment.id}/edit`}>
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
  candidates: SponsorOption[];
}) {
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<SponsorOption | null>(null);
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
            Attach a sponsor
          </h2>
          <p className="text-sm text-[var(--c-text-muted)]">
            Search the global sponsor list, or create a new one.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => dialogRef.current?.showModal()}
        >
          + New sponsor
        </Button>
      </div>

      {selected ? (
        <form action={attach} className="grid gap-4">
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="sponsorId" value={selected.id} />
          <div className="rounded-[var(--r-md)] border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-display font-semibold">
                  {selected.name}
                </div>
                <div className="font-mono text-xs text-[var(--c-text-subtle)]">
                  {selected.slug}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-xs text-[var(--c-text-muted)] underline"
              >
                Change
              </button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tier">
              <Input
                name="tier"
                defaultValue={selected.defaultTier ?? ""}
                placeholder="platinum / gold / silver / community"
              />
            </Field>
            <Field label="Booth label">
              <Input name="boothLabel" />
            </Field>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Attaching…" : "Attach sponsor"}
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
            aria-label="Search sponsors"
          />
          <div className="grid gap-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-[var(--c-text-muted)]">
                {candidates.length === 0
                  ? "Every sponsor is already attached. Create a new one →"
                  : "No matches. Try a different name, or create a new sponsor."}
              </div>
            ) : (
              filtered.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelected(s)}
                  className="flex items-center justify-between rounded-[var(--r-md)] border border-transparent px-3 py-2 text-left transition-colors hover:border-[var(--c-border)] hover:bg-[var(--c-surface)]"
                >
                  <div>
                    <div className="font-display font-semibold">{s.name}</div>
                    <div className="font-mono text-xs text-[var(--c-text-subtle)]">
                      {s.slug}
                    </div>
                  </div>
                  <div className="font-mono text-xs text-[var(--c-text-muted)]">
                    {s.defaultTier ?? ""}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <CreateSponsorDialog
        ref={dialogRef}
        eventId={eventId}
        onCreated={() => dialogRef.current?.close()}
      />
    </div>
  );
}

interface DialogProps {
  eventId: string;
  onCreated: () => void;
}

const CreateSponsorDialog = React.forwardRef<HTMLDialogElement, DialogProps>(
  function CreateSponsorDialog({ eventId, onCreated }, ref) {
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
          .normalize("NFKD")
          .replace(/[̀-ͯ]/g, "")
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
        className="m-auto w-[min(560px,calc(100vw-32px))] rounded-[var(--r-lg)] border border-[var(--c-border)] bg-[var(--c-bg)] p-0 text-[var(--c-text)] backdrop:bg-black/40"
      >
        <form action={create} className="grid gap-5 p-6">
          <input type="hidden" name="eventId" value={eventId} />

          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold">
                New sponsor
              </h2>
              <p className="text-sm text-[var(--c-text-muted)]">
                Creates a global sponsor and attaches it to this event.
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
            hint="Lowercase letters, numbers, and dashes. Used in URLs."
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
            <Field label="Tier (for this event)">
              <Input name="tier" placeholder="platinum / gold / silver" />
            </Field>
            <Field label="Booth label">
              <Input name="boothLabel" />
            </Field>
          </div>

          <Field label="Website URL">
            <Input name="websiteUrl" type="url" />
          </Field>
          <Field label="Logo URL">
            <Input name="logoUrl" type="url" />
          </Field>
          <Field label="Description">
            <Input name="description" />
          </Field>

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
