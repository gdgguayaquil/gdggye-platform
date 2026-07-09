"use client";

import * as React from "react";

import { Button, Input } from "@gdggye/ui-kit";

import {
  clearSpeakerPhotoAction,
  createSpeakerAction,
  updateSpeakerAction,
  type SpeakerActionState,
} from "./actions";

export interface SpeakerFormValues {
  id?: string;
  slug: string;
  name: string;
  roleEs: string | null;
  roleEn: string | null;
  city: string | null;
  bioEs: string | null;
  bioEn: string | null;
  photoUrl: string | null;
  websiteUrl: string | null;
  githubUrl: string | null;
  xUrl: string | null;
  linkedinUrl: string | null;
}

const initialState: SpeakerActionState = { ok: false };

function previewSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function SpeakerForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial: SpeakerFormValues;
}) {
  const action = mode === "create" ? createSpeakerAction : updateSpeakerAction;
  const [state, formAction, pending] = React.useActionState(
    action,
    initialState,
  );
  const fe = state.fieldErrors ?? {};

  const [name, setName] = React.useState(initial.name);
  const [slugManual, setSlugManual] = React.useState(initial.slug);
  const [slugTouched, setSlugTouched] = React.useState(initial.slug.length > 0);

  // Slug auto-follows the name while creating and untouched; once the user
  // edits it (or we're editing an existing record) it holds the manual value.
  // Derived during render — no effect syncing state to state.
  const slug =
    !slugTouched && mode === "create" ? previewSlug(name) : slugManual;

  return (
    <form action={formAction} className="grid max-w-[720px] gap-5">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <PhotoBlock initial={initial} />

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

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Role (es)">
          <Input name="roleEs" defaultValue={initial.roleEs ?? ""} />
        </Field>
        <Field label="Role (en)">
          <Input name="roleEn" defaultValue={initial.roleEn ?? ""} />
        </Field>
      </div>

      <Field label="City">
        <Input name="city" defaultValue={initial.city ?? ""} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Bio (es)">
          <textarea
            name="bioEs"
            defaultValue={initial.bioEs ?? ""}
            rows={4}
            className="w-full rounded-[var(--r-md)] border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-primary)]"
          />
        </Field>
        <Field label="Bio (en)">
          <textarea
            name="bioEn"
            defaultValue={initial.bioEn ?? ""}
            rows={4}
            className="w-full rounded-[var(--r-md)] border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-primary)]"
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Website">
          <Input
            name="websiteUrl"
            type="url"
            defaultValue={initial.websiteUrl ?? ""}
          />
        </Field>
        <Field label="GitHub">
          <Input
            name="githubUrl"
            type="url"
            defaultValue={initial.githubUrl ?? ""}
          />
        </Field>
        <Field label="X (Twitter)">
          <Input name="xUrl" type="url" defaultValue={initial.xUrl ?? ""} />
        </Field>
        <Field label="LinkedIn">
          <Input
            name="linkedinUrl"
            type="url"
            defaultValue={initial.linkedinUrl ?? ""}
          />
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : mode === "create" ? "Create speaker" : "Save"}
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

function PhotoBlock({ initial }: { initial: SpeakerFormValues }) {
  const [clearState, clearAction, clearing] = React.useActionState(
    clearSpeakerPhotoAction,
    { ok: false } as SpeakerActionState,
  );
  return (
    <div className="flex items-start gap-5">
      <div
        className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--c-border)] bg-[var(--c-surface)]"
        style={{ width: 120, height: 120 }}
      >
        {initial.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={initial.photoUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-[var(--c-text-subtle)]">
            no photo
          </div>
        )}
      </div>
      <div className="flex-1">
        <label className="eyebrow mb-2 block">Photo</label>
        <input
          type="file"
          name="photo"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="text-sm"
        />
        <div className="mt-1 text-xs text-[var(--c-text-subtle)]">
          JPG, PNG, WebP or AVIF. Square images render best. Max 4 MB.
        </div>
        {initial.id && initial.photoUrl ? (
          <form action={clearAction} className="mt-2">
            <input type="hidden" name="id" value={initial.id} />
            <button
              type="submit"
              className="text-xs text-[var(--c-text-muted)] underline"
              disabled={clearing}
            >
              {clearing ? "Removing…" : "Remove current photo"}
            </button>
            {clearState.error ? (
              <span className="ml-2 text-xs" style={{ color: "var(--c-red)" }}>
                {clearState.error}
              </span>
            ) : null}
          </form>
        ) : null}
      </div>
    </div>
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
