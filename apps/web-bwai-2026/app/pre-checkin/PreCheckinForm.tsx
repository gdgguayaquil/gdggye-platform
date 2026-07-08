"use client";

import * as React from "react";

import { Button, Input } from "@gdggye/ui-kit";

import { submitPreCheckinAction, type PreCheckinActionState } from "./actions";

export interface PreCheckinFormValues {
  badgeName: string;
  photoConsent: boolean;
  dietary: string | null;
  tshirtSize: string | null;
  notes: string | null;
}

const initialState: PreCheckinActionState = { ok: false };

const TSHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export function PreCheckinForm({ initial }: { initial: PreCheckinFormValues }) {
  const [state, formAction, pending] = React.useActionState(
    submitPreCheckinAction,
    initialState,
  );
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid gap-5">
      <Field
        label="Nombre en tu badge *"
        hint="Esto es lo que aparecerá impreso. Puede ser tu nombre, apodo o handle."
        error={fe.badgeName}
      >
        <Input
          name="badgeName"
          defaultValue={initial.badgeName}
          required
          maxLength={40}
        />
      </Field>

      <Field
        label="Restricciones alimenticias"
        hint="Vegetariano, vegano, sin gluten, alergias… opcional."
      >
        <Input
          name="dietary"
          defaultValue={initial.dietary ?? ""}
          placeholder="e.g. vegetariano, sin gluten"
        />
      </Field>

      <Field label="Talla de polera" hint="Para el kit del evento.">
        <select
          name="tshirtSize"
          defaultValue={initial.tshirtSize ?? ""}
          className="h-11 w-full rounded-full border border-[var(--c-border)] bg-[var(--c-surface)] px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-primary)]"
        >
          <option value="">— elegir —</option>
          {TSHIRT_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Notas para el organizador">
        <textarea
          name="notes"
          defaultValue={initial.notes ?? ""}
          rows={3}
          className="w-full rounded-[var(--r-md)] border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-primary)]"
          placeholder="Accesibilidad, llegada tarde, cualquier cosa que debamos saber."
        />
      </Field>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="photoConsent"
          defaultChecked={initial.photoConsent}
          className="mt-1"
        />
        <span>
          Acepto que el equipo de GDG tome y publique fotos donde pueda aparecer
          durante el evento (redes, recap, YouTube).
        </span>
      </label>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Guardando…" : "Guardar pre-checkin"}
        </Button>
        {state.ok ? (
          <span className="text-sm" style={{ color: "var(--c-green)" }}>
            Guardado. Recibirás una respuesta del staff antes del evento.
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
