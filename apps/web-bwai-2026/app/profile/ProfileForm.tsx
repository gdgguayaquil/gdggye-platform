"use client";

import * as React from "react";

import { Button, Input } from "@gdggye/ui-kit";

import { saveProfile, type ProfileFormState } from "./actions";

interface Props {
  initialEmail: string;
  initialFullName: string;
  initialCompany: string | null;
  initialRole: string | null;
  initialPhone: string | null;
  initialCity: string | null;
  hasAcceptedTerms: boolean;
  hasAcceptedPrivacy: boolean;
  hasAcceptedSponsor: boolean;
}

const initialState: ProfileFormState = { ok: false };

export function ProfileForm(props: Props) {
  const [state, formAction, pending] = React.useActionState(
    saveProfile,
    initialState,
  );

  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid max-w-[640px] gap-6">
      <div>
        <label className="eyebrow mb-2 block">Email</label>
        <Input type="email" value={props.initialEmail} disabled readOnly />
        <div className="mt-1 text-xs text-[var(--c-text-subtle)]">
          Sincronizado con tu cuenta de Google.
        </div>
      </div>

      <div>
        <label htmlFor="fullName" className="eyebrow mb-2 block">
          Nombre completo *
        </label>
        <Input
          id="fullName"
          name="fullName"
          defaultValue={props.initialFullName}
          required
        />
        {fieldErrors.fullName ? (
          <div className="mt-1 text-xs" style={{ color: "var(--c-red)" }}>
            Requerido
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="company" className="eyebrow mb-2 block">
            Empresa
          </label>
          <Input
            id="company"
            name="company"
            defaultValue={props.initialCompany ?? ""}
          />
        </div>
        <div>
          <label htmlFor="role" className="eyebrow mb-2 block">
            Cargo
          </label>
          <Input id="role" name="role" defaultValue={props.initialRole ?? ""} />
        </div>
        <div>
          <label htmlFor="phone" className="eyebrow mb-2 block">
            Teléfono
          </label>
          <Input
            id="phone"
            name="phone"
            defaultValue={props.initialPhone ?? ""}
          />
        </div>
        <div>
          <label htmlFor="city" className="eyebrow mb-2 block">
            Ciudad
          </label>
          <Input id="city" name="city" defaultValue={props.initialCity ?? ""} />
        </div>
      </div>

      <fieldset className="grid gap-3 rounded-[var(--r-md)] border border-[var(--c-border)] p-5">
        <legend className="eyebrow px-2">Consentimientos</legend>

        <ConsentRow
          name="termsAccepted"
          alreadyAccepted={props.hasAcceptedTerms}
          required
        >
          Acepto los <a href="#">términos de uso</a>.
        </ConsentRow>

        <ConsentRow
          name="privacyAccepted"
          alreadyAccepted={props.hasAcceptedPrivacy}
          required
        >
          Acepto la <a href="#">política de privacidad</a>.
        </ConsentRow>

        <ConsentRow
          name="sponsorAccepted"
          alreadyAccepted={props.hasAcceptedSponsor}
          required={false}
        >
          (Opcional) Permito que los sponsors del evento accedan a mi nombre y
          correo para hacer seguimiento.
        </ConsentRow>
      </fieldset>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Guardando…" : "Guardar"}
        </Button>
        {state.ok ? (
          <span className="text-sm" style={{ color: "var(--c-green)" }}>
            Guardado.
          </span>
        ) : null}
      </div>
    </form>
  );
}

function ConsentRow({
  name,
  alreadyAccepted,
  required,
  children,
}: {
  name: string;
  alreadyAccepted: boolean;
  required: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={alreadyAccepted}
        disabled={alreadyAccepted}
        required={required && !alreadyAccepted}
        className="mt-0.5"
      />
      <span>
        {children}
        {alreadyAccepted ? (
          <span
            className="ml-2 font-mono text-[11px] uppercase tracking-wider"
            style={{ color: "var(--c-text-subtle)" }}
          >
            (aceptado)
          </span>
        ) : null}
      </span>
    </label>
  );
}
