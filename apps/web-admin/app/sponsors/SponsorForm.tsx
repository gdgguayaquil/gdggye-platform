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
  slug: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
  websiteUrl: string | null;
  defaultTier: string | null;
}

const initialState: SponsorActionState = { ok: false };

// Mirror the use-case's slugify so the slug field can preview what will
// happen when the user submits a blank slug.
function previewSlug(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

  const [name, setName] = React.useState(initial.name);
  const [slug, setSlug] = React.useState(initial.slug);
  const [slugTouched, setSlugTouched] = React.useState(initial.slug.length > 0);

  React.useEffect(() => {
    if (!slugTouched && mode === "create") {
      setSlug(previewSlug(name));
    }
  }, [name, slugTouched, mode]);

  return (
    <form action={formAction} className="grid max-w-[640px] gap-5">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

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
        hint="Lowercase letters, numbers, and dashes. Used in URLs and as the sponsor's stable id."
        error={fe.slug}
      >
        <Input
          name="slug"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
          required
        />
      </Field>

      <Field
        label="Default tier"
        hint="Optional. Suggested when attaching to an event (override per event)."
      >
        <Input
          name="defaultTier"
          defaultValue={initial.defaultTier ?? ""}
          placeholder="platinum / gold / silver / community"
        />
      </Field>

      <Field label="Logo URL">
        <Input name="logoUrl" type="url" defaultValue={initial.logoUrl ?? ""} />
      </Field>

      <Field label="Website URL">
        <Input
          name="websiteUrl"
          type="url"
          defaultValue={initial.websiteUrl ?? ""}
        />
      </Field>

      <Field label="Description">
        <Input name="description" defaultValue={initial.description ?? ""} />
      </Field>

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
