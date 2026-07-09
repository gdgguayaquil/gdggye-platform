import { canParticipateInEvents } from "@gdggye/backend-core";

import { requireUser } from "@/lib/server/auth";

import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const user = await requireUser();
  const eligible = canParticipateInEvents(user);

  return (
    <div className="container-x py-16">
      <div className="mb-10">
        <div className="brand-rule mb-5" aria-hidden="true" />
        <div className="eyebrow mb-3">Tu cuenta</div>
        <h1
          className="h-display"
          style={{ fontSize: "clamp(32px, 4.5vw, 52px)" }}
        >
          Perfil
        </h1>
        <p className="mt-3 max-w-[560px] text-[var(--c-text-muted)]">
          Completa tu perfil y consentimientos para participar en los eventos
          del capítulo.
        </p>
      </div>

      {!eligible ? (
        <div
          className="mb-8 rounded-[var(--r-md)] border px-5 py-4 text-sm"
          style={{
            background: "var(--c-yellow-soft)",
            borderColor: "var(--c-yellow)",
            color: "var(--c-text)",
          }}
        >
          Tu cuenta aún no está habilitada para eventos. Completa el nombre y
          acepta los términos y la política de privacidad.
        </div>
      ) : (
        <div
          className="mb-8 rounded-[var(--r-md)] border px-5 py-4 text-sm"
          style={{
            background: "var(--c-green-soft)",
            borderColor: "var(--c-green)",
            color: "var(--c-text)",
          }}
        >
          ✓ Cuenta habilitada para eventos.
        </div>
      )}

      <ProfileForm
        initialFullName={user.fullName}
        initialCompany={user.company}
        initialRole={user.role}
        initialPhone={user.phone}
        initialCity={user.city}
        initialEmail={user.email}
        hasAcceptedTerms={user.acceptedTermsAt !== null}
        hasAcceptedPrivacy={user.acceptedPrivacyAt !== null}
        hasAcceptedSponsor={user.acceptedSponsorConsentAt !== null}
      />
    </div>
  );
}
